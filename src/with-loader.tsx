'use server';

import { AnyProps, SectionDataLoader, WithProvidedDataLoaderProps } from './types';
import React from 'react';
import LoaderWrapper from './loader-wrapper';

export const withLoader = <
  TComponentProps extends AnyProps = AnyProps,
  TLoaderProvidedProps extends AnyProps = AnyProps,
>(
  dataLoader: SectionDataLoader<TComponentProps, TLoaderProvidedProps>,
  Component: React.FC<WithProvidedDataLoaderProps<TComponentProps, TLoaderProvidedProps>>,
): React.FC<TComponentProps> => {
  return (props) => <LoaderWrapper dataLoader={dataLoader} props={props} section={Component} />;
};
