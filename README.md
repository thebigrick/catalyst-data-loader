## Disclaimer

This repository is a **ollaborative space** intended for discussion and exploration of a section-centric
data loading solution for Catalyst. **It is not an official, production-ready, or actively maintained
project**.

The code, examples, and ideas presented here are for **reference and experimentation only**. They are not
supported by any official team, and **should not be used in production environments**.

Contributions, suggestions, and discussions are welcome. However, please be aware that this repository
does not provide guarantees of stability, updates, or long-term maintenance.

## Introduction

Modern commerce platforms require front-end architectures that emphasize flexibility, performance,
and maintainability, particularly in headless and composable contexts such as Catalyst.
As projects scale and requirements become more complex, the conventional practice of loading data at the page level
and passing it down to components ("sections") leads to **increased coupling**, **repeated logic**,
and **reduced component portability**.

To address these limitations, this document proposes the adoption of a **section-centric data loading mechanism**
within Catalyst, leveraging Next.js server components and advanced batching techniques.
Through this mechanism, each section is enabled to **autonomously retrieve its required data** based solely on
minimal inputs (such as an entity ID), eliminating the need for parent components or pages to handle data fetching
or prop passing.

This approach results in sections that are self-contained, reusable, and composable.
Components are decoupled from their context, which significantly improves maintainability and developer experience.
Additionally, the implementation includes a batching and deduplication system that guarantees identical data loader
requests, executed with the same parameters, are performed only once.

An additional objective of this document is to promote a **more consistent interface for all sections**,
referred to as the **Commerce Interface**. By reducing the surface area of props passed to each component
and limiting them to only what is strictly required, this process **becomes significantly easier and more robust**.

The following document outlines the rationale, design, and advantages of this data loading pattern,
providing concrete examples of its application within the Catalyst project.

## Objectives

The primary objectives of introducing a section-centric data loading mechanism in Catalyst are as follows:

- **Promote Interface Consistency:** Standardize the way data is provided to all sections, establishing a consistent
  Commerce Interface across the codebase.
- **Minimize Prop Surface:** Limit the number of props required by each component to only essential identifiers
  (such as entity IDs), simplifying interfaces and reducing unnecessary coupling.
- **Improve Maintainability:** Enable sections to manage their own data dependencies, making the codebase easier to
  maintain and reducing the likelihood of bugs introduced by changes in data requirements.
- **Enhance Reusability:** Decouple sections from their parent contexts, making it possible to reuse components across
  different pages and scenarios without modification.
- **Optimize Performance:** Batch and deduplicate data loading requests to reduce redundant network or compute operations,
  improving the overall performance of the application.
- **Simplify Data Flow:** Allow each section to autonomously fetch its own data, removing the need for parent components
  to orchestrate or aggregate data for their children.

These objectives guide the design and implementation choices described in the following sections.

## Proposed Solution

The proposed solution introduces a standardized section-centric data loading mechanism, designed to address
the limitations of the current approach. Instead of requiring parent components or pages to fetch and pass down
all data, each section component is responsible for retrieving the data it needs, given only minimal input props
(such as an entity ID).

This mechanism is based on the following principles:

- Each section declares the **minimal set of props** required to identify the resource it needs to render (for example,
  `productId` for a product section).
- A **data loader function is associated with each section**, responsible for fetching and preparing all necessary data
  for the section, based on the input props. The same dataloader can potentially be used to provide information to
  multiple different sections.
- **Data loaders are executed on the server**, leveraging Next.js server components for optimal performance and security.
- Data loading requests with **identical parameters are automatically batched and deduplicated**, so repeated requests
  for the same data are performed **only once per cycle**.

### Example: Before and After

Consider the example of a product detail section.

**Current approach:**

```tsx
<ProductDetail
  product={{
    id: baseProduct.entityId.toString(),
    title: baseProduct.name,
    description: <div dangerouslySetInnerHTML={{ __html: baseProduct.description }} />,
    href: baseProduct.path,
    images: streamableImages,
    price: streamablePrices,
    subtitle: baseProduct.brand?.name,
    rating: baseProduct.reviewSummary.averageRating,
    accordions: streameableAccordions,
  }}
  ...
  ctaLabel={streameableCtaLabel}
  ctaDisabled={streameableCtaDisabled}
  ...
/>
```

In this approach, all product data **must be fetched and constructed at the page level**, and every new requirement
forces changes both in the parent and in the section itself.

**Proposed new approach**

```tsx
<ProductDetail
    productId={productId}
    ...
    ctaLabel={streameableCtaLabel}
    ctaDisabled={streameableCtaDisabled}
    ...
/>
```

With the new mechanism, only the minimal identifier is passed as a prop. The section's associated data loader is
responsible for fetching all required data and providing it to the section. If new data fields are needed, **only the
data loader and the section need to be updated**, without affecting parent components or the overall page structure.

This design enables cleaner, more maintainable, and more reusable components while improving data flow consistency
across the application.

## Technical Implementation

The section-centric data loading mechanism is built on a set of abstractions and utility functions that enable
sections to autonomously fetch their required data, while also providing batching and deduplication capabilities.
This implementation fully leverages Next.js server components and TypeScript type safety.

### Section Data Loader Pattern

Each section defines a **data loader**, which is a function that takes a minimal set of input props (such as an
identifier) and returns all the data required by the section.

Notably, requests to the data loader are **automatically batched**: if multiple sections require data for different
entities (for example, several product IDs), the loader receives all the requests together and **can perform a
single backend call knowing all involved IDs**.

Each data loader also defines a list of **dependency keys** (for example, `['productId']`), which are used for
deduplication: queries with the same dependencies and values are executed only once.

The loader is then associated with the section using a higher-order function `withLoader`.

The data loader is defined using a standardized interface. For example:


```ts
// Example of dataloader
import { type SectionDataLoader } from '@bigcommerce/catalyst-data-loader';

export interface ProductDetailSectionProps {
  productId: number;
}

export interface ProductDetailLoaderResult {
  product: ProductData;
  price: PriceData;
  images: ImageData[];
}

export const productDetailLoader: SectionDataLoader<
  ProductDetailSectionProps,
  ProductDetailLoaderResult
> = [
  async (propsBatch) => { // In this case, propsBatch is an array of "ProductDetailSectionProps"
    // Fetch all necessary product data in a single call
    return fetchProductsData(propsBatch.map(props => props.productId));
  },
  ['productId'], // A list of dependecies in a hook-like style
];
```

### Associating a Loader with a Section

To connect the loader to a section, a higher-order function called `withLoader` is used. This function wraps
the section component and ensures that, given the minimal input props, the data loader is executed and its results
are **injected into the section's props automatically**.

```tsx
// ProductDetailSection.tsx
import { withLoader } from '@bigcommerce/catalyst-data-loader';
import { productDetailLoader, ProductDetailLoaderResult } from './loader';

interface ProductDetailSectionProps {
  productId: number;
}

export const ProductDetailSection = withLoader<
  ProductDetailSectionProps,
  ProductDetailLoaderResult
>(
  productDetailLoader,
  (props) => ( // props now contains ProductDetailLoaderResult data
    <div>
      <h1>{props.product.name}</h1>
      <div>Price: {props.price.value}</div>
      {/* ...other fields */}
    </div>
  )
);
```

Now, using the section in a page is straightforward and requires only the minimal prop:

```tsx
<ProductDetailSection productId={productId} />
```

### Batching and Deduplication

The implementation includes a batching layer based on the `dataloader`(https://www.npmjs.com/package/dataloader) library.
When multiple instances of a section request the same data (for example, two sections rendering the same product
by productId), **the loader is executed only once per unique set of parameters**.

This optimization **avoids redundant requests and improves overall performance**.

See the internal implementation:

```ts
// get-batched-data-loader.ts (internal implementation) 
import DataLoader from 'dataloader';

const batchedDataLoader = new Map();

function getBatchedDataLoader(sectionDataLoader) {
  if (!batchedDataLoader.has(sectionDataLoader)) {
    batchedDataLoader.set(
      sectionDataLoader,
      new DataLoader(sectionDataLoader[0], {
        cacheKeyFn: key => JSON.stringify(key),
      })
    );
  }
  return batchedDataLoader.get(sectionDataLoader);
}
```

## Benefits and Trade-offs

### Benefits

- **Improved Maintainability:** By isolating data loading logic within each section, changes to data
  requirements are localized and do not require updates to parent components or pages.
- **Enhanced Reusability:** Sections become more portable and can be reused across multiple contexts without
  concern for their parent’s data structure or responsibilities.
- **Consistent Interfaces:** The adoption of a minimal and standardized set of props leads to a more
  predictable and manageable Commerce Interface.
- **Optimized Performance:** Automatic batching and deduplication of requests reduce redundant network calls
  and backend load, especially when multiple sections require similar data.
- **Cleaner Codebase:** Parent components and pages become simpler, with less responsibility for data
  orchestration and prop drilling.

### Trade-offs / Limitations

- **Increased Abstraction:** The use of higher-order functions and loaders introduces an additional layer of
  abstraction that may require onboarding or additional documentation for developers unfamiliar with the
  pattern.
- **Dependency on Accurate Keys:** Deduplication relies on well-defined dependency keys in each loader.
  Incorrect or missing keys may lead to redundant requests or missing data.
- **Potential Overhead for Simple Use Cases:** In scenarios where data requirements are trivial or
  non-repetitive, the overhead of batching and loader management might not provide significant benefits.
- **Server-Centric Design:** The pattern is optimized for server components and may need adaptation for
  client-side or hybrid rendering scenarios.

This section-centric data loading strategy should be evaluated in the context of specific project needs and
team expertise.
