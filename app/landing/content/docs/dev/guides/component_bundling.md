---
title: "Dynamic Component Bundling"
weight: 5
---

### [Dynamic Component Bundling](#dynamic-component-bundling)

As a project grows larger, there should be some control around how the project is bundled and served to the client. In our case, Awayto utilizes React as a front-end library to construct and execute our component library. As part of React, we get access to the Suspense and Lazy APIs, which enable us to gain that bit of control we need.

With modern JavaScript bundlers, we can make use of tree-shaking and code-splitting to output our project into file chunks. This ultimately means a client only downloads components that it needs to render in real-time. And as most components will be small in nature, these added requests aren't too big of a deal in the grand scheme of load times.

To accomplish this, we use a mixture of some build-time scripting,the JavaScript Proxy API, as well as the aforementioned React APIs, Suspense and Lazy.

- As part of our [CRACO configuration]({{< param "repoURL" >}}/blob/main/app/website/craco.config.js), the function `checkWriteBuildFile` parses the structure of our `/app/website/src/modules` folder, and writes a manifest for all the components and contexts available to us. This manifest is stored in `/app/website/src/build.json`.
- In our series of [React hooks]({{< param "repoURL" >}}/blob/main/app/website/src/hooks), `useComponents` and `useContexts` use the manifest to load files when needed, and keep a local cache of downloaded components. 
- By using the Proxy API, our hook allows us to download/use a component just by accessing it as a property of `useComponents` (or `useContexts`). `useContexts` will pick up any file ending with `Context`, so beware.
- If a component doesn't exist, an empty div will be rendered instead. With advanced usage, we can feature-lock components from being used without running into compilation errors in the event a component isn't in the package.
```tsx
import { useComponents } from 'awayto/hooks';

export default SomeComponent() {
  const { MyComponent, doesntExist } = useComponents();

  return <>
    <MyComponent /> {/* All good! */}
    <doesntExist /> {/* This won't run anyway because the d isn't capitalized, which you knew, right? But if it were, it'd still be a plain old <div /> */}
  </>
}
```

As a result of this method, we incur some side effects. For example, you will notice that at no time is "MyComponent" `import`ed anywhere. What this means is we lose static analysis when it comes to build time type checking, error handling, and so forth. The builder knows that we have a module folder full of React components, and it will build each one into its own chunk as necessary. However, it won't know how files are interconnected and used within one another. As we use TypeScript, this means we need a way to share types across the project. The solution is to globally extend our component properties interface whenever and where-ever we are making the component, which is seen in many of the existing components. Random example:

```tsx
// ...
declare global {
  interface IProps {
    pendingQuotesAnchorEl?: null | HTMLElement;
    pendingQuotesMenuId?: string;
    isPendingQuotesOpen?: boolean;
    handleMenuClose?: () => void;
  }
}

export function PendingQuotesMenu({ handleMenuClose, pendingQuotesAnchorEl, pendingQuotesMenuId, isPendingQuotesOpen }: IProps): React.JSX.Element {
// ...
```

Now when we go to implement this component in other components, using the `useComponents` hook, we can properly utilize the prop types. Beware of using the same prop type names in different components, as we are extending a global interface.

An arguably large benefit of all of this is that our first-time visit to the site more or less incurs the same, small, package download size. We don't bundle all our components into one large file, and they are loaded asynchronously on-demand. So the initial app download size will remain small (less than 1 MB!; mostly the styling libraries) even with thousands of components in the system. Whether or not this is useful to your specific project is for you to determine; the use of `useComponents` or `useContexts` isn't compulsory.