export interface PaginationContext<T> {
    $implicit: T[];
    productsGroup: T[];
    index: number;
    pageIndexes: number[];
    appPaginationOf: T[];
    next: () => void;
    back: () => void;
    selectIndex: (index: number) => void;
}
