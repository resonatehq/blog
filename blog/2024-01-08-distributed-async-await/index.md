---
slug: distributed-async-await
title: Distributed Async Await
authors: [dtornow]
tags: [distributed async await]
---

Software engineers are getting crushed by the complexity of distributed systems. Engineers waste time writing boilerplate code for retries, recovery, rate limiting, and observability yet still applications break in production.

Why? Traditional programming models were not designed for the unique challenges of distributed applications.

Resonate's programming model, **Distributed Async Await**, extends the widely popular async await programming model and goes beyond the boundaries of a single process, making distributed computing a first-class citizen.

<!-- truncate -->

## Design Principles

Resonate's vision is to provide a programming model for distributed applications that not only meets technical demands but provides a delightful developer experience. After all, who doesn't want to be delighted?

Async await provides a delightful developer experience when we need to express concurrency and coordination in a single process. Launching hundreds or thousands of concurrent tasks and collecting their results can be done in just a few lines of code. But across multiple machines? Async await's previously delightful developer experience quickly becomes dreadful, a few lines of code turn into a never ending nightmare.

What happened? Well, async await was designed to make concurrent programming simple, async await was not designed to make distributed programming simple.

A delightful developer experience makes a task at hand <span style={{fontFamily: "Rubik Wet Paint"}}>Dead Simple</span>. At Resonate that's not just a catch phrase but the bedrock of our engineering philosophy, and grounded in our principles.

- 🏴‍☠️ A <span style={{fontFamily: "Rubik Wet Paint"}}>Dead Simple</span> programming model should be built with a minimal set of abstractions; those abstractions should be as general as possible so they can be uniformly applied in all areas.

- 🏴‍☠️ A <span style={{fontFamily: "Rubik Wet Paint"}}>Dead Simple</span> programming model should be comprehensible to a single software engineer with minimal overhead.

A consistent abstraction lays the foundation for building applications of any scale, from the smallest to the largest, from the most simple to the most complex. This uniformity guarantees consistency and predictability at every step. If any part of the programming model works differently from the rest, that part will require additional effort to comprehend.

Therefore, a programming model with a delightful developer experience not only implies a programming model that is <span style={{fontFamily: "Rubik Wet Paint"}}>Dead Simple</span> to use but also <span style={{fontFamily: "Rubik Wet Paint"}}>Dead Simple</span> to understand.

## Distributed Async Await

Based on these principles, we designed Distributed Async Await to be an extension of the traditional async await programming model.

Like traditional async await, Distributed Async Await is built on the concept of functions and promises, the universal abstractions to express concurrency, coordination, and integration. Distributed Async Await elevates the traditional paradigm beyond the boundaries of a single process, making distributed computing a first-class citizen

By extending instead of replacing async await, we've created an incremental transition from the world of concurrent programming into the world of distributed programming. You don't have to _rewire your brain_, instead you can build on your knowledge and experience to _extend your horizon_.

🏴‍☠️
