'use server';

import { AnyProps, FilteredProps, SectionDataLoader, WithProvidedDataLoaderProps } from './types';
import React from 'react';
import getBatchedDataLoader from './get-batched-data-loader';

export interface LoaderWrapperProps<
  TComponentProps extends AnyProps = AnyProps,
  TLoaderProvidedProps extends AnyProps = AnyProps,
> {
  dataLoader: SectionDataLoader<TComponentProps, TLoaderProvidedProps>;
  props: TComponentProps;
  section: React.FC<WithProvidedDataLoaderProps<TComponentProps, TLoaderProvidedProps>>;
}

const LoaderWrapper = async <
  TComponentProps extends AnyProps = AnyProps,
  TLoaderProvidedProps extends AnyProps = AnyProps,
>({
  dataLoader,
  props,
  section,
}: LoaderWrapperProps<TComponentProps, TLoaderProvidedProps>) => {
  const batchedLoader = getBatchedDataLoader<TComponentProps, TLoaderProvidedProps>(dataLoader);

  // Extract the keys that are allowed to be forwarded to the loader
  const forwardProps = Object.keys(props).reduce(
    (acc, key) => {
      if (dataLoader[1].includes(key)) {
        (acc as any)[key] = props[key];
      }

      return acc;
    },
    {} as FilteredProps<TComponentProps, (typeof dataLoader)[1]>,
  );

  // Load the data using the batched loader
  const providedProps = await batchedLoader.load(forwardProps);

  // Return the section component with the provided props
  return section({ ...props, ...providedProps } as WithProvidedDataLoaderProps<
    TComponentProps,
    TLoaderProvidedProps
  >);
};

export default LoaderWrapper;
