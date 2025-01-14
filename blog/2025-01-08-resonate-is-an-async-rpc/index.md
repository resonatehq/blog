---
slug: resonate-is-an-async-rpc
title: Resonate is also an async RPC framework
description: Discover how Resonate transforms distributed systems with asynchronous Remote Function Invocations (RFIs), offering durable promises, seamless fault recovery, and a sequential programming model.
authors: [flossypurse]
image: /img//img/service-based-architecture-async.png
tags:
  - async-rpc
  - resonate-server
  - task-framework
  - durable-promises
  - resonate-sdk
---

One of the most important APIs that Resonate offers, is the **Remote Function Invocation**.

In the code example below, `ctx.rfi("your_function", args)` invokes the `your_function()` function whether that function is local to the Application Node or it is on a completely different Application Node.

```python
@resonate.register
def your_workflow(ctx, args):
    # highlight-next-line
    your_func_promise = yield ctx.rfi(
        "your_function", args
    ).options(send_to=poll("your-service-nodes"))
    # ... Do some stuff
    # Await on the result of your_customer_function
    your_func_result = yield your_func_promise
    # ...
```

And because of how Resonate durably stores the invocation requests as Durable Promises, this effectively provides developers with an asynchronous RPC framework.

<!-- truncate -->

## Sync protocols vs async protocols

Consider a service based architecture.

![Polyglot synchrnonous service based architecture](/img/service-based-architecture-sync.svg)

A common approach for these services to communicate, is for each service to have its own HTTP server to handle requests and responses.
Another common approach is to use gRPC, Google's Remote Procedure Call framework.

In both of those approaches, the protocols by which these services communicate are synchronous, meaning the request and response must happen sequentially to succeed.

In synchronous communication protocols, the caller must also act as a supervisor.
If the callee goes does, the communication channel is broken and the caller must create a new request, hoping the callee is now available.
By default this causes the procedure to start new on the callee side, unless you are manually crafting and managing idempotency keys.
And, if the caller goes down, there is no way for the callee to know, creating another set of issues.

In comparison, Resonate Remote Function Invocations act as reliable asynchrounouse Remote Procedure Calls.

![Polyglot asynchronous service based architecture](/img/service-based-architecture-async.svg)

Each RFI corresponds to the creation of a Durable Promise.
RFIs that are meant to invoke a function also correspond to the creation of a Task.
The Resonate Server ensures the Task routes to the appropriate service (otherwise known as an Application Node) with an "Invoke" message, "Invoke function `some_customer_function` with the attached arguments" for example.

Now, here are the cool things about this design.

1. The caller does not need to block progress on the result of the call.
   It gets a promise when it makes the call and may choose to await on those results at any point in the function's sequence after the creation of the Durable Promise.
   If the results are not there when it asks for them, the function awaits.
   If the results are already there when it asks for them, the caller function gets them and continues on.

2. The Resonate Server acts as a supervisor, so if the callee goes down, the Resonate Server will know and will resend the invoke message if the service comes back up, or it will send the invoke message to the backup service that has the `some_customer_function`.

3. When the callee completes the procedure, the results are stored in the Durable Promise, and another Task is created.
   This time, the Task is routed to the caller server with a "Resume" message, "Resume the caller function with these results" for example.
   If the caller goes down, the Resonate Server will know that too and will resend the Resume message when the caller service is back up, or it will send the resume message to a backup service that has the calling function, initiating a replay of the caller function on the backup service to effectively resume from where it left off.

## What about queues?

A common approach to get around the synchronous nature of HTTP and gRPC protocols is to use queues.
The caller service puts a message on a queue, and then listens to another queue for a response.

![Polyglot service based architecture with queues](/img/service-based-architecture-queues.svg)

Persisting a job to a queue implies that there is no single place where the business flow of the application is defined.
Essentially, the distributed application relies on a service or component each to play a part and then hand off the next step to another service or component.
Practically this makes it very hard to for a single developer to learn, reason about, and contribute to the application's business flow.

With Resonate, an entire workflow sequence can be defined in a single function in one of the services, calling out to the difference services with Remote Function Invocations.

In effect, Resonate provides developers with a sequential looking programming model that excels in distributed and concurrent use cases.

But that's not all, if you need to integrate with a queuing system, but still want a sequential programming model,
you can use have the Resonate Server place the Invoke and Resume messages onto the existing queuing system, and configure your services to get the messages from there instead of the Resonate Server and still retain all the benefits.

![Resonate service based architecture integrate with queues](/img/service-based-architecture-integrate-with-queues.svg)

Resonate's generic Task Framework will place Invoke and Resume messages on Queues, send them to HTTP endpoints, or make them available to long poll requests from Application Nodes.

## Possible topologies

There are three aspects of the Resonate model that enable a wide range of topologies.

1. Resonate's protocols work with many different technologies such as queues and serverless compute.

![Resonate service based architecture integrate with queues](/img/service-based-architecture-integrate-queues-serverless.svg)

2. Application Nodes can be deployed in groups.

![Resonate service based architecture node groupes](/img/service-based-architecture-node-groups.svg)

You set which group the Application Node belongs to when you use the SDK.

```python
resonate = Resonate(
    store=RemoteStore(url="http://localhost:8001"),
    # highlight-next-line
    task_source=Poller(url="http://localhost:8002", group="gateway")
)
```

3. An Application Node is not confined to get messages from a single Resonate Server.

![Resonate service based architecture multiple servers](/img/service-based-architecture-multiple-servers.svg)

## Conclusion

Resonate redefines how developers approach distributed systems by offering a seamless asynchronous RPC framework through Remote Function Invocations (RFIs).
Unlike traditional synchronous protocols like HTTP or gRPC, Resonate introduces a programming model that prioritizes durability, concurrency, and reliability without sacrificing simplicity.

With Durable Promises, developers gain fine-grained control over their workflows, ensuring that both caller and callee services remain resilient to failures.
By acting as the supervisor, the Resonate Server removes the burden of retry logic, fault detection, and manual recovery from developers.
Furthermore, Resonate empowers teams to define entire workflows within a single function while retaining compatibility with external queuing systems and other technologies.

From reducing the complexity of managing asynchronous tasks to enabling flexible integration with queues and serverless compute, Resonate presents a highly adaptable solution that simplifies the development of distributed applications.
Developers no longer need to cobble together fragile architectures that mix synchronous APIs, queues, and manual fault recovery.
Instead, they can focus on building reliable, concurrent, and scalable systems using Resonate’s sequential-looking programming model.

In a world where distributed systems are increasingly the norm, Resonate bridges the gap between simplicity and sophistication, making it a compelling choice for modern cloud-native applications.
If you’re ready to transform how your applications communicate, it’s time to give Resonate a try.
