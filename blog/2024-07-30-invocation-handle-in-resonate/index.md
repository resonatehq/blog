---
slug: invocation-handle-in-resonate
title: Invocation Handle in Resonate
authors: [avillegas]
tags: []
---

# InvocationHandle in Resonate

The latest version of the Resonate SDK significantly changes its architecture: The new architecture is simpler and removes the use of a ResonatePromise, instead opting for the standard JS Promise. But what problems are we trying to solve with the new architecture, and which new patterns does it enable?

## Motivation

The main motivation for the new architecture was to simplify our codebase. The previous architecture had some tangled control flow that made it difficult to reason about, but this tangled flow wasn't there for no reason. There was an inherent problem we needed to solve.

Our primary selling point is that the promises are Durable, meaning they're stored in durable storage. We needed to make a server request to create the DurablePromise and await its completion before we could tell the user the ResonatePromise was ready for use. This led to the complexity we had in the first place.

It was necessary to have many promises inside a ResonatePromise, each signaling different stages in the process of creating a ResonatePromise. For example, we had a `created` promise to signal that the durable promise was actually created. It also had a another Promise to signal the completion/rejection of the user-passed function. These different promises were created and resolved at different stages and in different parts of the code. They needed to be passed around a quite complex object graph.

The SDK was <span style={{fontFamily: "Rubik Wet Paint"}}>Dead Simple</span> to use, but not <span style={{fontFamily: "Rubik Wet Paint"}}>Dead Simple</span> to understand.

## Enter the InvocationHandle

As mentioned before, we needed a way to signal that the DurablePromise was created before we could continue with the rest of the execution of the user function. What if we make this step explicit and give the user a Handle to the invocation they just made? When the user receives this handle, it's guaranteed that the durable promise was created and the execution of their function started.

The InvocationHandle holds the result Promise, which is where we put the result of the user function when resolving the promise. The result Promise is created when Invoke is called. Invoke uses an async thunk to do the whole process of executing the user code with the proper retries, resolving or rejecting the durable promise, handling all the different kinds of errors, and finally rejecting or resolving the result `Promise` held by the InvocationHandle. This pattern is mostly enabled by the good support of lexical closures in JS.

This pattern is so simple that all of it can be expressed in a single function. In fact, most of the current implementation of the Resonate SDK is in a single file, with some other support files to enable extensibility by the user and handle the communication with the Resonate server.

Here's how it looks in JS pseudo-code:

```jsx
async invokeLocal(func, args, opts): InvocationHandle {
    let options = calculateOptsWithDefaults(options)
    let id = calculateId()

    let durablePromise = await store.createDurablePromise(id, opts)

    const runFunc = async (): Promise<R> => {
        let error;
        let value;
        let success = true;
        try {
          value = await runWithRetry(func, args)
        } catch (e) {
          success = false;
          handleErrorsInUserFunction()
        }
        if (success) {
          await store.resolveDurablePromise(id, value)
          resolve(value)
        } else {
          await store.rejectDurablePromise(id, error)
          reject(error)
        }
    };

    // Note we are not awaiting the end of runFunc, we will store it
    // in the invocationHandle returned to the user
    const resultPromise: Promise<R> = runFunc();
    const invocationHandle = new InvocationHandle(resultPromise, id);
    return invocationHandle;
  }

```

This pseudocode is the essence of invokeLocal, and I'd argue it's the essence of the Resonate TypeScript SDK. If you look at the actual code, it might not look exactly like this unless you squint hard enough. This pseudo-code omits details like handling unrecoverable errors, invocation caching, eventual consistency, and code to handle a more flexible API and set of options.

The usage of the InvocationHandle will look something like this:

```tsx
resonate.register('foo', async (ctx: Context) => {
  const handle = await ctx.invokeLocal(async (ctx: Context) => {
    await setTimeout(1000)
    console.log("World")
  }, options({retryPolicy: never()}))

  console.log("Hello")

  let durablePromise = resonate.store.promises.get(handle.invocationId);
  console.log(durablePromise.state) // prints: PENDING

  await handle.result();

  durablePromise = resonate.store.promises.get(handle.invocationId);
  console.log(durablePromise.state) // prints: RESOLVED
})

const topHandle = await resonate.invokeLocal("foo", "foo.0")
await topHandle.result()

```

When the user gets hold of an InvocationHandle, it's guaranteed that we have created a `DurablePromise` and started executing the user function. Once the user awaits the `result()` promise, we guarantee to run the user function to completion in the absence of unrecoverable errors.

We still provide the `run` api as an easier but more opaque way of creating a `DurablePromise` and run the function to completion, all in a single function call, with the trade off of not having easy access to the `DurablePromise` id

## Wrapping Up

The new Resonate SDK architecture simplifies our codebase while preserving the core functionality of durable promises. By introducing the InvocationHandle and leveraging standard JS Promises, we've addressed the complexities that arose from our previous design.

This new approach offers:

1. Clearer control flow
2. Explicit durability guarantees
3. Simpler implementation 

We encourage developers to explore the new SDK and leverage these improved patterns in their applications. Your feedback and innovative use cases will be crucial as we continue to evolve Resonate.
