---
slug: transparent-batching-with-the-resonate-python-sdk
title: Transparent batching with the Resonate Python SDK
description: The Resonate SDK provides a way for developers to batch operations transparently.
authors: [flossypurse, tomas.perez]
image: /img/muffin-trimmed.png
tags:
  - python
  - resonate-sdk
  - batching
---

![Batched muffins](/img/muffin-trimmed.png)

The Resonate Python SDK is shaping up to provide developers with a delightful experience for building distributed applications.

:::tip RSVP for the webinar

[RSVP for the upcoming webinar](https://www.resonatehq.io/webinars) to learn more about the Python SDK!

:::

This post highlights one of the SDK’s features that might make you jump for joy.

Let's talk about batching.

## Problem space

To ensure we’re all on the same page, "batching" refers to the practice of grouping multiple operations into a single unit of work.

**Why do this?**

Because performing operations in batches can be much more efficient than processing them one by one.

When we talk about efficiency we could be talking about two different things:

1. **Speed**
2. **Resource utilization**

With speed, the benefit is clear - things happen faster and you are removing bottlenecks.

With resource utilization, the benefit will often come down to cost savings.
In todays cloud environments, you are often charged for resources you use.
If a resource is remote and accessed over a network, you may be charged every time you access it.

This level of efficiency might not be significant at smaller scales, but at larger scales, efficiency becomes crucial.

For example, processing 100,000 operations sequentially can be far more costly and time-consuming than batching those 100,000 operations into a single task. Of course, the target system must support batching.

So let's focus on a concrete example.

Consider an application that creates a row in a database for each new user.

If the application gets less than 1 new user per minute, or even every 30 seconds, then it can probably handle sequential inserts.
In other words, the application can run and commit one SQL query per new user and there may not ever be a problem.

```python
def _create_user(user: int):
    conn.execute("INSERT INTO users (value) VALUES (?)", (user,))
    conn.commit()
    print(f"User {user} has been inserted to database")
```

But what if the applications suddenly becomes really popular?
What if, hypothetically, it received 1000 new users per second? 🚀
The database would save to durable storage on each query and the application probably wouldn't be able to keep up with all the demand.
Each second there would be a longer and longer delay for users to get added to the database.
We can imagine that, if these user creation requests were coming over a network, that many of them would timeout while waiting for their turn to get a row in the database.

In this very simplified example, we might now consider batching SQL queries so that more user rows are created per commit.

```python
def _create_users_in_batch(users: list[int]):
   for user in users:
       conn.execute("INSERT INTO users (value) VALUES (?)", (user,))
   conn.commit()
   print(f"{len(users)} users have been inserted to database.")
```

If we can batch thousands of queries into a single commit, then likely the application would be able to keep up with the demand.

:::tip In Production

In production, ensure that inserts are idempotent to account for the possibility of retries.

:::

In theory that sounds great.
In practice, now you have to manage the complexity of coordinating otherwise concurrent executions to collect a batch.

Sounds like a trade off of on complexity vs developer experience right?

Not if you use Resonate. 😉

## Resonate's solution

The Resonate Python SDK gives you a handy set of APIs to manage the practical complexities of batching operations.

If we assume that you are willing to embrace Resonate's programming mode, then at a high level, Resonate just requires that you define a data structure and a handler.

Let's look at how you would implement the use case above with Resonate.

First, create a data structure that inherits what Resonate calls a Command interface.
The data structure must include the data to be inserted into the database.
The Command data structure stands in for a function execution invocation so that you still get a promise and await on result of the commit.

<!--SNIPSTART examples-py-features-batching-init {"selectedLines":["1","6","16-19"]}-->

[features/batching/src/batching/**init**.py](https://github.com/resonatehq/examples-py/blob/main/features/batching/src/batching/__init__.py)

```py
from dataclasses import dataclass
# ...
from resonate.commands import Command
# ...
# Define a data structure for the Resonate SDK to track and create batches of
@dataclass
class InsertUser(Command):
    id: int
```

<!--SNIPEND-->

Then, create a handler that can process a batch of SQL queries.
This should look similar to the code that batched the SQL queries above.

<!--SNIPSTART examples-py-features-batching-init {"selectedLines":["2", "21-28"]}-->

[features/batching/src/batching/**init**.py](https://github.com/resonatehq/examples-py/blob/main/features/batching/src/batching/__init__.py)

```py
# ...
from resonate.context import Context
# ...
# Define a function that inserts a batch of rows into the database
# The main difference is that commit() is only called after all the Insert statements are executed
def _batch_handler(_: Context, users: list[InsertUser]):
    # error handling ommitted for this example
    for user in users:
        conn.execute("INSERT INTO users (value) VALUES (?)", (user.id,))
    conn.commit()
    print(f"{len(users)} users have been inserted to database.")
```

<!--SNIPEND-->

Next, register the data structure and the handler with the Resonate Scheduler.

<!--SNIPSTART examples-py-features-batching-init {"selectedLines":["3-5","13-14", "38-39"]}-->

[features/batching/src/batching/**init**.py](https://github.com/resonatehq/examples-py/blob/main/features/batching/src/batching/__init__.py)

```py
# ...
from resonate.scheduler import Scheduler
from resonate.storage import LocalPromiseStore
from resonate.retry_policy import never
# ...
# Create a Resonate Scheduler with an in memory promise store
resonate = Scheduler(LocalPromiseStore(), processor_threads=1)
# ...
# Register the batch handler and data structure with the Resonate Scheduler
resonate.register_command_handler(InsertUser, _batch_handler, retry_policy=never())
```

<!--SNIPEND-->

Finally, create a function that can be invoked over and over again and passes the data to Resonate to manage.
Register it with the Resonate Scheduler, and then call that function with Resonate's `run()` method.

<!--SNIPSTART examples-py-features-batching-init {"selectedLines":["30-33", "35-36","41", "48-56"]}-->

[features/batching/src/batching/**init**.py](https://github.com/resonatehq/examples-py/blob/main/features/batching/src/batching/__init__.py)

```py
# ...
# Definte the top level function that uses batching
def create_user_batching(ctx: Context, u: int):
    p = yield ctx.lfi(InsertUser(u))
    yield p
# ...
# Register the top level functions with the Resonate Scheduler
resonate.register(create_user_batching, retry_policy=never())
# ...
def main() -> None:
# ...
    # Create an array to hold the promises
    promises = []

    for u in range(10000):
        p = resonate.run(f"insert-value-{u}", create_user_batching, u)
        promises.append(p)

    for p in promises:
        p.result()
```

<!--SNIPEND-->

:::tip Coroutines in action

Resonate promotes the use of coroutines anytime there is a need to await on the result of another execution.
You will see coroutines generically referred to as functions, but know that you are actually using coroutines whenever a value is yielded into the execution.

:::

From top to bottom, taking into account database setup, a working application would look something like this:

<!--SNIPSTART examples-py-features-batching-init-->

[features/batching/src/batching/**init**.py](https://github.com/resonatehq/examples-py/blob/main/features/batching/src/batching/__init__.py)

```py
from dataclasses import dataclass
from resonate.context import Context
from resonate.scheduler import Scheduler
from resonate.storage import LocalPromiseStore
from resonate.retry_policy import never
from resonate.commands import Command
import sqlite3

# Create an SQLite database if it doesn't exist
# Create a connection with that database
conn = sqlite3.connect("your_database.db", check_same_thread=False)

# Create a Resonate Scheduler with an in memory promise store
resonate = Scheduler(LocalPromiseStore(), processor_threads=1)

# Define a data structure for the Resonate SDK to track and create batches of
@dataclass
class InsertUser(Command):
    id: int

# Define a function that inserts a batch of rows into the database
# The main difference is that commit() is only called after all the Insert statements are executed
def _batch_handler(_: Context, users: list[InsertUser]):
    # error handling ommitted for this example
    for user in users:
        conn.execute("INSERT INTO users (value) VALUES (?)", (user.id,))
    conn.commit()
    print(f"{len(users)} users have been inserted to database.")

# Definte the top level function that uses batching
def create_user_batching(ctx: Context, u: int):
    p = yield ctx.lfi(InsertUser(u))
    yield p

# Register the top level functions with the Resonate Scheduler
resonate.register(create_user_batching, retry_policy=never())

# Register the batch handler and data structure with the Resonate Scheduler
resonate.register_command_handler(InsertUser, _batch_handler, retry_policy=never())

def main() -> None:
    # Drop the users table if it already exists
    conn.execute("DROP TABLE IF EXISTS users")
    # Create a new users table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, value INTEGER)"
    )
    # Create an array to hold the promises
    promises = []

    for u in range(10000):
        p = resonate.run(f"insert-value-{u}", create_user_batching, u)
        promises.append(p)

    for p in promises:
        p.result()
```

<!--SNIPEND-->

The example above shows that batching happens transparently in the background.
The SDK handles the coordination of otherwise concurrent executions on a platform level and you still get to write concurrent, non-coordinated code.

:::tip Configure batch size

If you want to ensure a maximum batch size, you need only supply that when registering the handler:

```python
resonate.register_command_handler(InsertUser, _batch_handler, maxlen=1000)
```

:::

But is this actually more efficient?

## Benchmark it

To demonstrate the efficiency we will do the following things.

First, we will adjust our application to support the option to do sequential writes.

<!--SNIPSTART examples-py-features-batching-benchmark-init {"selectedLines":["18-28", "50-51"] }-->

[features/batching-benchmark/src/batching/**init**.py](https://github.com/resonatehq/examples-py/blob/main/features/batching-benchmark/src/batching/__init__.py)

```py
# ...
### SEQUENTIAL INSERTS
# Define a function that inserts a single row into the database
def _create_user(ctx: Context, value: int):
    conn.execute("INSERT INTO users (value) VALUES (?)", (value,))
    conn.commit()
    print(f"User {value} has been inserted to database")

# Define a top level function that uses sequential inserts
def create_user_sequentially(ctx: Context, v: int):
    p = yield ctx.lfi(_create_user, v).with_options(retry_policy=never())
    yield p
# ...
# Register the top level functions with the Resonate Scheduler
resonate.register(create_user_sequentially, retry_policy=never())
```

<!--SNIPEND-->

Then we will update our application to expose a simple CLI for us to choose whether to process batch writes or sequential writes.
We will also capture the start time and the end time of the operation.

<!--SNIPSTART examples-py-features-batching-benchmark-init {"selectedLines":["8-9", "57-96"] }-->

[features/batching-benchmark/src/batching/**init**.py](https://github.com/resonatehq/examples-py/blob/main/features/batching-benchmark/src/batching/__init__.py)

```py
# ...
import click
import time
# ...
# Define a CLI to create an interaction point
@click.command()
@click.option("--batch/--no-batch", default=False)
@click.option("--users", type=click.IntRange(0, 100_000))
def cli(batch: bool, users: int):
    # To benchmark, we start from a clean slate each time
    # Drop the users table if it already exists
    conn.execute("DROP TABLE IF EXISTS users")
    # Create a new users table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, value INTEGER)"
    )
    conn.commit()
    # Create an array to store all the promises
    promises = []
    # Capture the starting time of the operation
    start_time = time.time_ns()
    # If batching, run the batch inserts
    if batch:
        for v in range(users):
            p = resonate.run(f"insert-batch-user-{v}", create_user_batching, v)
            promises.append(p)
    # If not batching, run the sequential inserts
    else:
        for v in range(users):
            p = resonate.run(f"insert-no-batch-user-{v}", create_user_sequentially, v)
            promises.append(p)

    # Yield all promises to ensure they are all complete
    for p in promises:
        p.result()

    # Capture the ending time of the operation
    end_time = time.time_ns()
    print(
        f"Inserting {users:,} users took {(end_time-start_time)/1e9:2f} seconds with batching={batch}"
    )

def main() -> None:
    cli()
```

<!--SNIPEND-->

Let's run this with 10,000 sequential user inserts.

```shell
rye run batching --no-batch --values=10000
```

First, we will see a log for each and every insert.

```text
Value 0 has been inserted to database
Value 1 has been inserted to database
...
Value 9999 has been inserted to database
```

And we will see it has taken roughly 3.5 seconds to complete.

```text
Inserting 10,000 values took 3.459524 seconds with batching=False
```

Now let's run the same number of values using batching.

```shell
rye run batching --batch --values=10000
```

We should notice that we see only about a dozen inserts logged.

```text
Values from 0 to 495 have been inserted to database.
Values from 496 to 1796 have been inserted to database.
Values from 1797 to 2017 have been inserted to database.
Values from 2018 to 3067 have been inserted to database.
Values from 3068 to 3518 have been inserted to database.
Values from 3519 to 5038 have been inserted to database.
Values from 5039 to 6878 have been inserted to database.
Values from 6879 to 7372 have been inserted to database.
Values from 7373 to 7374 have been inserted to database.
Values from 7375 to 8380 have been inserted to database.
Values from 8381 to 8889 have been inserted to database.
Values from 8890 to 9481 have been inserted to database.
Values from 9482 to 9999 have been inserted to database.
```

And it took less than a second to complete.

```text
Inserting 10,000 values took 0.733565 seconds with batching=True
```

In this example we can see that batching improves efficiency, both for resource utilization (less inserts to the database).
And it becomes more and more impactful at higher volumes.
Try it out 50,000 or 100,000 inserts to see for yourself using the [batching-benchmark](https://github.com/resonatehq/examples-py/features/batching-benchmark) example in the examples-py repository.

## Conclusion

The Resonate SDK provides a way for developers to batch operations transparently.
The developer need only define a data structure and a handler function that processes the batch.
Resonate will then automatically handle the batching and execution of the handler function.

The batching operations that Resonate provides is more efficient in speed and resource usage in comparison to non-batched operations, which could reduce costs.

Want to learn more about the Python SDK?
[Join the waitlist](https://forms.gle/BnFiDUQExseQcH8h9) or [RSVP for an upcoming webinar](https://www.resonatehq.io/webinars)!
