import { AnyProps, FilteredProps, SectionDataLoader } from './types';
import DataLoader from 'dataloader';
import { LRUMap } from 'lru_map';

const batchedDataLoader = new Map<SectionDataLoader, DataLoader<AnyProps, AnyProps>>();

const getBatchedDataLoader = <
  TComponentProps extends AnyProps = AnyProps,
  TLoaderProvidedProps extends AnyProps = AnyProps,
>(
  sectionDataLoader: SectionDataLoader<TComponentProps, TLoaderProvidedProps>,
): DataLoader<
  FilteredProps<TComponentProps, (typeof sectionDataLoader)[1]>,
  TLoaderProvidedProps
> => {
  if (!batchedDataLoader.has(sectionDataLoader as SectionDataLoader)) {
    batchedDataLoader.set(
      sectionDataLoader as SectionDataLoader,

      new DataLoader(sectionDataLoader[0], {
        // @ts-expect-error: It is expected to return the same type as the input
        cacheKeyFn: (key) => JSON.stringify(key),
        cacheMap: new LRUMap(100),
      }),
    );
  }

  return batchedDataLoader.get(sectionDataLoader as SectionDataLoader)! as DataLoader<
    TComponentProps,
    TLoaderProvidedProps
  >;
};

export default getBatchedDataLoader;
