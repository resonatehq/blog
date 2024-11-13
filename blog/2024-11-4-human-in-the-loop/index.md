---
slug: human-in-the-loop-with-the-python-sdk
title: Human-in-the-loop with the Resonate Python SDK
description: The Resonate SDK provides a way for developers to batch operations transparently.
authors: [flossypurse]
image: /img/verify-email-trimmed.png
tags:
  - python
  - resonate-sdk
  - batching
---

![Woman sits at the computer about to verify her email address](/img/verify-email-trimmed.png)

In the world of distributed systems, one of the most common situations that developers have to solve for is the "human-in-the-loop".

Human-in-the-loop is the term we use for situations where a business process gets blocked waiting for input from a real person.

![human in the loop sequence diagram](/img/human-in-the-loop.svg)

Any time you have had to confirm your email address is a good example of this.

## Problem space

The biggest problem with human-in-the-loop situations is that a developer has absolutely no way to control how long it takes for the human to respond.
This means that, the main business process needs to be designed in a way where it can effectively suspend for an indefinite period of time.

:::tip business process vs workflow vs process

A business process is the end-to-end sequence of steps that a business or application is seeking to complete.
The term "business process" is often synonymous with "workflow".

This is not to be confused with a computational process that takes place on a physical or virtual machine.

:::

This has led developers down rabbit holes, architecting solutions to this issue, that usually involve queues, databases, cron jobs, etc...
While these solutions can generally solve for this issue, the experience of developing them, maintaining them, and augmenting them is brutal.

Consider an application that starts a business process that requires a human to verify their email address before it can proceed any further.

Because there is no way to know how long it will take for the human to click a link in the email sent to them, the business process needs to be designed so that it can suspend for an indefinite period of time for this specific user.

One common approach to solve this is to have multiple services that communicate with a central database.

![Services communicating with a central database](/img/database-centric.svg)

The first service might immediately insert a row in the database with a column "email_confirmed" that has a value of False.
The service would then trigger the delivery of an email to the human.

At this point the business process would need to be prepared to wait for an unknown period of time.
We could imagine the potential issues that could arise if the actual process in the service tried to stay alive while waiting for the human to respond.

- If the process crashed, all sorts of logic would need to be introduced to check if the email was already sent after the process was brought back up.
- The process uses valuable computing resources waiting, possibly creating bottlenecks in other workflows starting and proceeding.

So, after the data is inserted into the database, and the email is sent, the function would return, giving up control of the rest of the business process to some other part of the system.

This pattern would continue as each service did its part, handing off the rest of the business process to some other part of the system.

Perhaps there are messages queues or cron jobs as part of the system that act as glue, connecting the different services and steps in the process.

But, the biggest takeaway from any such architecture is that there is no single location where the entire end-to-end business process is defined.
The main "business logic" is spread out across an entire system of components and code bases.

This property is what ultimately creates an aweful developer, operating, and maintence experience as it becomes increasingly challenging to add new functionality, diagnose issues, and reason about the behavior of the system.

## Resonate's solution

Resonate provides a programming model that enables a developer to define a business process sequence in a function.
The programming model is designed to make waiting on anything a delightful experience.

Let's look at how you might implement the use case above with Resonate.

First, let's define a service that sends an email to a human.
The service won't actually send an email, but will instead just print "email sent", and we can pretend that the email contains a link that the human will click, verifying their email address.

```python
from resonate.scheduler import Scheduler
from resonate.context import Context
from resonate.storage.resonate_server import RemoteServer

resonate = Scheduler(
    RemoteServer(url="http://localhost:8001"), logic_group="email-service"
)

def send_email(ctx: Context, email: str):
    print (f"Email sent to {email}")
    return

resonate.register(name="send_email", func=send_email)

def main():
    print("Email service started")
    resonate.wait_for_ever()

if __name__ == "__main__":
    main()
```

Thanks to `resonate.wait_for_ever()` this process will stay alive with a long poll connection to the Resonate Server.

Next, let's define a service that exposes a public endpoint for the link in the email to resolve to.

```python
from flask import Flask, jsonify, request
from resonate.scheduler import Scheduler
from resonate.storage.resonate_server import RemoteServer

import json

app = Flask(__name__)
store = RemoteServer(url="http://localhost:8001")
resonate = Scheduler(store)

@app.route("/confirm", methods=["POST"])
def start_workflow_route_handler():
    global store
    try:
        data = request.get_json()
        if "email" not in data:
            return jsonify({"error": "email param is required"}), 400
        email = data["email"]
        store.resolve(
            promise_id=f"email-confirmed-{email}",
            ikey=None,
            strict=False,
            headers=None,
            data=json.dumps(True),
        )
        return jsonify({"message": f"Email {email} confirmed."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def main() -> None:
    app.run(host="0.0.0.0", port=5001)


if __name__ == "__main__":
    main()
```

This service will enable us to confirm the email by sending a cURL request to localhost:5001.

The key part of this is `store.resolve()` which resolves the Durable Promise with an ID of `email-confirmed-{email}`.
The main workflow will be awaiting on the resolution of that promise.

Lastly, we can define our main workflow sequence that calls the email service, and awaits on the email address confirmation.

```python
from flask import Flask, jsonify, request
from resonate.scheduler import Scheduler
from resonate.context import Context
from resonate.storage.resonate_server import RemoteServer
from resonate.commands import CreateDurablePromiseReq

app = Flask(__name__)
resonate = Scheduler(
    RemoteServer(url="http://localhost:8001"), logic_group="workflow-service"
)


def step3(ctx: Context):
    print("Next step in the process")


def workflow(ctx: Context, email: str):
    # Step 1 - send email with a link to confirm
    yield ctx.rfc(
        CreateDurablePromiseReq(
            promise_id=f"send-confirmation-email-{email}",
            data={"func": "send_email", "args": [email], "kwargs": {}},
            headers=None,
            tags={"resonate:invoke": "poll://email-service"},
        )
    )
    print(f"Email sent to {email}")

    # Step 2 - wait on human input
    confirmation = yield ctx.rfc(
        CreateDurablePromiseReq(
            promise_id=f"email-confirmed-{email}",
        )
    )
    print(f"Email address {email} confirmed: {confirmation}")

    # Step 3
    yield ctx.lfc(step3)

    # Add as many steps as needed

    return


resonate.register(workflow)


@app.route("/start", methods=["POST"])
def start_workflow_route_handler():
    try:
        data = request.get_json()
        if "email" not in data:
            return jsonify({"error": "email is required"}), 400
        email = data["email"]
        resonate.run(f"workflow-{email}", workflow, email)
        return jsonify({"result": "workflow started"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def main() -> None:
    app.run(host="0.0.0.0", port=5000)


if __name__ == "__main__":
    main()
```

We will be able to start the Workflow with a curl request to localhost:5000 and watch the output for signs of progress.

The first step of the Workflow is to send an email to the provided email address.
We do this by making an [Remote Function Invocation](https://docs.resonatehq.io/concepts/distributed-async-await#remote-function-invocation).

The `yield` statement acts as an `await` statement would and blocks progress until the `send-confirmation-email-{email}` promise resolves.
In this case the promise resolves when our email service function `send_email()` returns.

Step 2 is where we have the human-in-the-loop.
In this step, the workflow creates a Durable Promise `email-confirmed-{}` and waits on its resolution.

## Conclusion

With Resonate, the entire high-level business process can be defined inside a single function.
The sequence can wait
