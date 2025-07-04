import { BatchLoadFn } from 'dataloader';

export type AnyProps = Record<string, any>;

export type FilteredProps<
  TComponentProps,
  TAllowedProps extends readonly (keyof TComponentProps)[],
> = Pick<TComponentProps, TAllowedProps[number]>;

export type WithDataLoaderProps<
  TComponentProps extends AnyProps = AnyProps,
  TLoaderProvidedProps extends AnyProps = AnyProps,
> = TComponentProps & Partial<TLoaderProvidedProps>;

export type WithProvidedDataLoaderProps<
  TComponentProps extends AnyProps = AnyProps,
  TLoaderProvidedProps extends AnyProps = AnyProps,
> = TComponentProps & TLoaderProvidedProps;

export type SectionDataLoader<
  TComponentProps extends AnyProps = AnyProps,
  TLoaderProvidedProps extends AnyProps = AnyProps,
  TAllowedProps extends readonly (keyof TComponentProps)[] = readonly (keyof TComponentProps)[],
> = [
  BatchLoadFn<FilteredProps<TComponentProps, TAllowedProps>, TLoaderProvidedProps>,
  TAllowedProps,
];
