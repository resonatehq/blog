---
slug: resonate-is-an-async-rpc
title: Resonate is also an async RPC framework
description: Discover how Resonate transforms distributed systems with asynchronous Remote Function Invocations (RFIs), offering durable promises, seamless fault recovery, and a sequential programming model.
authors: [flossypurse]
image: /img/service-based-architecture-async.png
tags:
  - async-rpc
  - resonate-server
  - task-framework
  - durable-promises
  - resonate-sdk
---

One of the most important APIs that Resonate offers, is the **Remote Function Invocation**.

In the code example below, `ctx.rfi("bar", args)` invokes the `bar()` function whether that function is local to the service or it is on a completely different service.

```python
@resonate.register
def foo(ctx, args):
    # highlight-next-line
    promise_bar = yield ctx.rfi(
        "bar", args
    ).options(send_to=poll("service-bar"))
    # ... Do some stuff
    # Await on the result of your_customer_function
    result = yield promise_bar
    # ...
```

And because of how Resonate durably stores the invocation requests, this effectively provides developers with an asynchronous RPC framework.

Let's dive into how it does that.

<!-- truncate -->

## Context

For the purpose of establishing a mental model and clearly communicating ideas, let's first establish some context around the following:

- request flows
- synchronous and asychronous terminonlogy
- common headaches

### Request flows

Consider a service based architecture.

![Service based architecture diagram](/img/async-rpc/service-based-architecture.svg)

In a service based architecture, a business process can span multiple services.
And there are several request flows that support the overarching business process.

A request flow could be a **chain**:

![Service based architecture chain request flow diagram](/img/async-rpc/service-based-architecture-chain.svg)

A request flow could be a **fan out**:

![Service based architecture fan request flow diagram](/img/async-rpc/service-based-architecture-fan.svg)

A request flow could also be **detached**:

![Service based architecture detached request flow diagram](/img/async-rpc/service-based-architecture-detached.svg)

Or, depending on how many services involved, it could be a combination of all three.

![Service based architecture chain/fan request flow diagram](/img/async-rpc/service-based-architecture-chain-fan-combo.svg)

These request flows can happen in a synchronous manner, or asynchronous manner.

### Sync vs async

Let's make sure we have a shared understanding of what it means to be "asynchronous".

The request flows in these distributed services happen in one of two ways, **synchronous** and **asynchronous**.

The diagram below illustrates **synchronous** vs **asynchronous** sequences between two **functions**.

![Sync vs Async diagram](/img/async-rpc/sync-vs-async.svg)

While we will use functions to help us define **synchronous** and **asynchronous**, the sequences can apply directly to **services** as well!
And as we will explore shortly, it can apply to **functions** invoked in completely different **services** when using Resonate.

**Synchronous**

In a **synchronous protocol** the caller makes the request and waits for the response.

```python
def foo():
    result = await bar()
    result = await baz()
```

`foo()` waits for the result from `bar()` before calling `baz()`.

Practically, in a distributed environment HTTP and gRPC tend to be the most popular **synchronous protocols** you find in the field.
HTTP gateways enable REST APIs that can be built and launched rather quickly, and gRPC enables highly performant procedure calls across services.

**Asynchronous**

In an **asynchronous protocol** the caller can make the request, does more stuff, and then choose when to wait for the response.

```python
def foo():
    promise_bar = bar()
    # do stuff
    promise_baz = baz()
    # do more stuff
    result_bar = await promise_bar
    result_baz = await promose_baz
```

`foo()` can call both `bar()` and `baz()` and then get the results whenever it wants to.
This is asynchronous because `bar()` and `baz()` are now executing concurrently to `foo()`, where previously there was only one execution happening at a time.

In the case of the detached call, the caller would likely synchronously wait for confirmation that the request was received and then continue on without waiting on the result.

```python
def foo():
    bar()
    # do stuff
```

The decoupling of the invocation and side effects of the result from the caller is considered **asynchronous** communication.
With a **function**, this only makes sense if you know that `bar()` is **asynchronous**.

When it comes to **asynchronous protocols** with distributed **services**, you tend to start hearing about queues.
Queues are decoupled from services, sitting between them, enabling **asynchronous** communication.

![Service based architecture with queues](/img/async-rpc/service-based-architecture-queues.svg)

Which protocols are used depends on the use case and what you are trying to do.

The struggle comes when developers must think about and explicitly deal with these protocols at the application level.

### Application-level complexities

Writing code for business process needs and failure scenarios at the application level creates aweful developer experiences.

Two of the fundamental complexities that you tend to see interleved with business process code at the application-level are:

- **Supervision**: Think coordination and recovery.
  Developers end up creating bespoke or piecing together supervision solutions to solve for load balancing, service discovery, execution retries from network interruptions, and execution recovery from service failures (both on the caller and the callee side), making business process code very bloated and complex.
- **Distributed business process definition**: Persisting a job to a queue, for example, usually implies that there is no single place where the business flow of the application is defined.
  Essentially, the distributed application relies on a service or component each to play a part and then hand off the next step to another service or component, making it very hard for developers to reason about and maintain the behavior of the system.
  Even if there was a single top-level function that placed jobs onto a queue, and then listened to queues for responses, it would be non-trivial ensuring that function execution stayed alive the entire time.
  A bespoke solution would be needed to replay interrupted function executions and deduplicate jobs or unwanted side effects.

Bespoke solutions to these issues have typically resulted in mostly horrible developer experiences for most contributing developers.
In other words, there is a lot of complexity that developers need to deal with at the application level.

So what is different about Resonate's Async RPC?

Resonate aims to push much of this complexity into the platform level.

## Imagine Async RPC

Let's look at the code example showcasing **Resonate's Remote Function Invocation** again:

```python
@resonate.register
def foo(ctx, args):
    promise = yield ctx.rfi(
        "bar", args
    ).options(send_to=poll("service-bar"))
    # ... Do some stuff
    # Await on the result of bar()
    result = yield promise
    # ...
```

Consider the previous code example and imagine the following:

- Imagine if `foo()` can call `bar()`, receive a promise, and choose to wait on the result of `bar()` at any point after. That is - `foo()` does not need to block progress on the result of `bar()` until it needs to - and it wouldn't matter if `bar()` was local to `foo()` or on a remote service.
- Imagine that you can run multiple `foo`, `bar`, and `baz` services and the invocation requests automatically went to the respective service with capacity.
- Imagine that even if `bars()`'s service crashes during execution, the invocation request of `bar()` is automatically resent when the service restores, or the invocation request is automatically sent to another `bar` service that has capacity.
- Imagine that even if `foo()`'s service crashes, the result of `bar()` is automatically provided back to `foo()` when `foo()`'s service restores, or the result is automatically sent to another `foo` service where `foo()` would be replayed up to the point where the result is needed, without any unwanted side effects.
- Imagine that you could write sequential looking code that reflects the sequence of your business process but you don't have to worry about bloating your code base with bespoke supervision, load balancing, and function retry components and protocols.
- Imagine that `foo()`, `bar()`, and `baz()` can make any combination of synchronous, asynchronous, chain, fan, and/or detached request flows to any other function, even calling themselves recursively.

What would you call such a thing?
You might call it a **highly reliable Asynchronous Remote Procedure Call Framework**.
And that is exactly what Resonate offers.

But how does this work?
And what is asked of the developer?

### How it works

Similar to how queues sit between services to enable asynchronous communication, Resonate Servers sit between the services.
Or, to be more specific, the Resonate Servers sit between the service groups.

![Asynchronous service based architecture](/img/async-rpc/service-based-architecture-with-resonate.svg)

You can deploy:

- between 1 and n services
- between 1 and n service groups
- between 1 and n services within those groups
- between 1 and n Resonate Servers

The system is designed so that you are not forced into a star-like topology with a single Resonate Server in the center, but instead so that each service can work with as many Resonate Servers as is needed/desired.

This topology supports fully asynchronous fan-out, chain, and detached request flows across services through function to function calls.

And it enables developers to write sequential looking code where service discovery, load balancing, execution retries, and crash recovery are pushed into the platform-level.

All that is asked of the developer is for each service to specify the Resonate Servers, where it gets tasks from, which service group it belongs to, and to wrap function invocations with Resonate APIs.

```python
# service foo fan-out example
from resonate.task_sources.poller import Poller
from resonate.stores.remote import RemoteStore
from resonate.resonate import Resonate

resonate = Resonate(
    store=RemoteStore(url="http://localhost:8001"),
    # highlight-next-line
    task_source=Poller(url="http://localhost:8002", group="service-foo"),
)

@resonate.register
def foo(ctx):
    try:
        print("running function foo")
        promise_bar = yield ctx.rfi("bar").options(send_to=poll("service-bar"))
        promise_baz = yield ctx.rfi("baz").options(send_to=poll("service-baz"))
        result_bar = yield promise_bar
        result_baz = yield promise_baz
        return result_bar + result_baz + 1
    except Exception as e:
        print(e)
        raise
```

The previous code example showcases an asynchronous fan-out request flow where `bar()` and `baz()` are each invoked in their own services and each return 1.

:::tip Example excersizes

To try out this example yourself, and several excersizes showcasing crash recovery, function execution retries, as well as a chain request flow, and a detached request flow, check out the [resonate-is-async-rpc](https://github.com/flossypurse/resonate-is-async-rpc) project on Github.

:::

Each RFI corresponds to the creation of a Durable Promise.
RFIs that are meant to invoke a function also correspond to the creation of a Task.
The Resonate Server ensures the Task routes to the appropriate service with an "Invoke" message, "Invoke function `bar()` with the attached arguments" for example.

In the previous example, `foo()` gets a promise when it makes the RFI and does not need to block progress.
It may choose to await on those results at any point in the function's sequence after the creation of the Durable Promise.
If the results are not there when it asks for them, the function awaits.
If the results are already there when it asks for them, the caller function gets them and continues on.

The Resonate Server acts as a supervisor, so if the bar or baz services crash, the Resonate Server will know and will resend the respective invoke message if the services restore, or it will send the respective invoke message to the respective backup service.

When `bar()` and/or `baz()` completes, the results are stored in the Durable Promise, and another Task is created.
This time, the Task is routed to the foo service with a "Resume" message, "Resume `foo()` with these results" for example.
If the foo service crashes, the Resonate Server will know that too and will resend the Resume message when the foo service is back up, or it will send the resume message to a backup foo service, initiating a replay of the `foo()` function on the backup service to effectively resume from where it left off.

Next let's dive into how Resonate's design aims to simplify the integration into existing systems.

### Task sources

In the previous code examples, you may have noticed that the `task_source` is of type `Poller` and invocation requests are sent to service groups with a `poll()` designation.

By default, services connected to a Resonate Server will open up long poll requests with the Server to acquire tasks.

However, a Resonate Server can place Tasks onto queues, send them to HTTP or rGRP endpoints, or any other transport component.
And a service using Resonate can acquire those Tasks from those same transports.

![Resonate service based architecture integrated with ueues](/img/async-rpc/service-based-architecture-integrate-with-queues.svg)

In the previous diagram, service baz acquires all of its tasks from message queues.

This integration capability makes Resonate an extrememly versatile and reliable Async RPC framework for distributed applications.

## Conclusion

Resonate offers a transformative approach to distributed systems by providing a reliable Asynchronous Remote Procedure Call (RPC) framework that simplifies service communication and enhances reliability.
By abstracting away complexities like service discovery, load balancing, execution retries, and crash recovery, Resonate allows developers to focus on business logic rather than infrastructure challenges.

With features like Remote Function Invocations (RFIs), Durable Promises, and the flexibility to integrate with existing transport systems such as queues or HTTP endpoints, Resonate pushes much of the complexity into the platform layer.
This results in code that is sequential in appearance but fully asynchronous and resilient in practice.

Whether you’re building scalable microservices or complex workflows, Resonate enables you to define business processes in a single function while ensuring your distributed system is both reliable and fault-tolerant.
It is not just an Async RPC framework—it’s a paradigm shift for developing distributed applications.

For developers looking to reduce the complexity of distributed systems while improving reliability and scalability, Resonate is an essential tool to explore.
