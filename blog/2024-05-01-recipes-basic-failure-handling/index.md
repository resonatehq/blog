---
slug: recipes-basic-failure-handling
title: "Resonate Recipes: Basic Failure Handling"
authors: [dfarr]
tags:
  - recipes
  - error-handling
---

In this edition of Resonate Recipes we will explore catchable and non-catchable failure and how Resonate mitigates these failure types.

:::info
To follow along, head over to the Resonate Recipes [repository on GitHub](https://github.com/resonatehq/recipes), clone the repository, and navigate to the [Basic Failure Handling](https://github.com/resonatehq/recipes/tree/main/basic-failure-handling) recipe.
:::

<!-- truncate -->

## Catchable and Non-catchable Failure

import Tweet from '@site/src/components/Twitter';

<Tweet id="1784628736056521120"></Tweet>

In distributed systems, we have to distinguish between catchable failure and non-catchable failure.

- **Catchable failures** refer to the set of failures that can be detected and mitigated by a process itself e.g. in a try catch block. Examples include io failure such as a file not found exception or networking failure such as a request timeout exception.

- **Non-catchable failures** refer to the set of failures that cannot be detected and mitigated by a process. My favourite mental model is to imagine the plug being pulled on the machine running a process.

### Recovering from catchable failure

Resonate detects and mitigates catchable failure via transparent try catch and by retrying executions. To see this in action, try running the following program. If you have cloned the recipes repo, you can run this example by running `npm run catchable`.

```ts
import { Resonate, Retry } from "@resonatehq/sdk";

// instantiate resonate
const resonate = new Resonate();

// register a function with resonate
resonate.register("foo", async () => {
  // try something that might fail
  console.log("trying...");

  if (Math.random() > 0.5) {
    throw new Error("!!! ERROR !!!");
  }

  console.log("success!");
});

resonate.run(
  "foo",
  "foo.1",
  resonate.options({
    retry: Retry.exponential(),
  })
);
```

Running this function directly would, on average, fail 50% of the time. But executing via Resonate (almost) always succeeds. Why is this?

By default when an exception is thrown, a Resonate function will be retried with exponential backoff up until a specified timeout. The default timeout of a Resonate function is ten seconds. This means that our function may be retried up to six times in a single execution, dropping the probability of seeing an exception to just 0.8%.

You can play around with different retry policies by changing the options. Resonate provides exponential, linear, and no retries out-of-the-box.

```ts
Retry.exponential();
Retry.linear();
Retry.never();
```

### Recovering from non-catchable failure

Resonate detects and mitigates non-catchable failure, after a process restarts, by restarting executions. We refer to this as the recovery path.

For the following example to work we are going to need the Resonate Server, which can be installed with Homebrew if you are on Mac or [downloaded from GitHub](https://github.com/resonatehq/resonate/releases/tag/v0.5.1).

```sh
# install
brew install resonatehq/tap/resonate

# start
resonate serve
```

To see this type of recovery in action, try running the following program. If you have cloned the recipes repo, you can run this example by running `npm run noncatchable`.

```ts
import { Resonate } from "@resonatehq/sdk";

// instantiate resonate
// this time will will increase the timeout
const resonate = new Resonate({
  url: "http://localhost:8001",
  timeout: 60000,
});

// register a function with resonate
resonate.register("foo", () => {
  // try something that might fail
  console.log("trying...");

  // simulate unexpected failure
  if (Math.random() > 0.5) {
    console.log("!!! ERROR !!!");
    process.exit(1);
  }

  console.log("success!");
});

// start resonate
// this will enable restart with resume semantics
resonate.start();

async function main() {
  const id = "foo.1";

  // lazily run foo
  const promise = await resonate.promises.get(id).catch(() => null);
  if (!promise) {
    resonate.run("foo", id);
  }
}

main();
```

When you run this program, there is a 50% chance that it will come crashing to a halt. Unlike last time where our function threw an exception, this time we use `process.exit()` — our program doesn’t stand a chance!

To demonstrate recovery we need to first observe a crash. If you get lucky and the execution succeeds on the first attempt, keep bumping the id until the program crashes. Once a crash occurs, restart the program. On restart any pending executions will be resumed and once again there is a 50% chance we will see another crash, if this happens keep restarting the program until the execution succeeds.

What is going on here? When your program is wired up to a Resonate server, Resonate writes a representation of the function call to storage using a concept called a Durable Promise, the core abstraction upon which Resonate is built. Like familiar promises, Durable Promises can be fulfilled exactly once; unlike familiar promises, Durable Promises are both addressable and persistent.

But what does this mean in practice?

When Resonate is started with a call to `resonate.start()` a background process is kicked off on an interval to check for any pending Durable Promises. When one is found, Resonate first acquires a lock to ensure mutual exclusion, and then calls the function corresponding to the Durable Promise. This process repeats until either all Durable Promises are fulfilled or timed out.

## Key Takeaways

In this inaugural edition of Resonate Recipes we have seen that:

- Resonate mitigates **catchable failures** through retries.
- Resonate mitigates **non-catchable failures** by restarting executions.
- Resonate uses **Durable Promises** to implement failure mitigation (and much more).

If you want dive further into Resonate, check out our [docs](https://docs.resonatehq.io) and our [quickstart](https://github.com/resonatehq/quickstart-ts). If you want to learn more about Durable Promises check out the [specification](https://github.com/resonatehq/durable-promise-specification).

In the next edition of Resonate Recipes we are going to tackle the question that is on everyone's mind — what is distributed async await anyways? Stay tuned!
