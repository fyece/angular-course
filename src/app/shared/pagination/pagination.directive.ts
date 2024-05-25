import {
    Directive,
    Input,
    OnChanges,
    OnInit,
    SimpleChanges,
    TemplateRef,
    ViewContainerRef,
    inject,
} from '@angular/core';
import {BehaviorSubject, filter, map} from 'rxjs';
import {PaginationContext} from './pagination-context.interface';

@Directive({
    selector: '[appPagination]',
})
export class PaginationDirective<T> implements OnInit, OnChanges {
    private readonly currentIndex$ = new BehaviorSubject<number>(0);

    private readonly templateRef = inject<TemplateRef<PaginationContext<T>>>(TemplateRef);
    private readonly viewContainerRef = inject(ViewContainerRef);

    @Input() appPaginationOf: T[] | null | undefined;
    @Input() appPaginationChankSize = 24;

    static ngTemplateContextGuard<T>(
        _directive: PaginationDirective<T>,
        _context: unknown,
    ): _context is PaginationContext<T> {
        return true;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    static ngTemplateGuard_appPaginationOf<T>(
        _directive: PaginationDirective<T>,
        _inputValue: unknown,
    ): _inputValue is T[] {
        return true;
    }

    ngOnChanges({appPaginationOf}: SimpleChanges): void {
        if (appPaginationOf) {
            this.updateView();
        }
    }

    ngOnInit(): void {
        this.listencurrentIndex();
    }

    private updateView() {
        if (this.isNotEmpty()) {
            this.currentIndex$.next(0);

            return;
        }

        this.viewContainerRef.clear();
    }

    private listencurrentIndex() {
        this.currentIndex$
            .pipe(
                filter(() => this.isNotEmpty()),
                map(currentIndex => this.getCurrentContext(currentIndex)),
            )
            .subscribe(context => {
                this.viewContainerRef.clear();
                this.viewContainerRef.createEmbeddedView(this.templateRef, context);
            });
    }

    private isNotEmpty(): boolean {
        return Boolean(this.appPaginationOf?.length);
    }

    private getCurrentContext(currentIndex: number): PaginationContext<T> {
        const appPaginationOf = this.appPaginationOf as T[];
        const chunk = this.getCurrentChunk(this.currentIndex$.value);
        const pageIndexes = this.getPageIndexes();

        return {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $implicit: chunk,
            productsGroup: chunk,
            index: currentIndex,
            pageIndexes,
            appPaginationOf,
            next: () => {
                this.next();
            },
            back: () => {
                this.back();
            },
            selectIndex: (index: number) => {
                this.goToPage(index);
            },
        };
    }

    private getCurrentChunk(currentIndex = 0): T[] {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.appPaginationOf!.slice(
            currentIndex * this.appPaginationChankSize,
            (currentIndex + 1) * this.appPaginationChankSize,
        );
    }

    private getPageIndexes(): number[] {
        const pageIndexes: number[] = [];

        if (this.appPaginationOf?.length) {
            const pagesCount = Math.ceil(this.appPaginationOf.length / this.appPaginationChankSize);

            for (let i = 0; i < pagesCount; i++) {
                pageIndexes.push(i);
            }
        }

        return pageIndexes;
    }

    private next() {
        const lastIndex = this.getPageIndexes().length ? this.getPageIndexes().length - 1 : 0;
        const nextIndex = this.currentIndex$.value + 1;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const newIndex = nextIndex <= lastIndex ? nextIndex : lastIndex;

        this.currentIndex$.next(newIndex);
    }

    private back() {
        const previousIndex = this.currentIndex$.value - 1;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const newIndex = previousIndex < 0 ? 0 : previousIndex;

        this.currentIndex$.next(newIndex);
    }

    private goToPage(index: number) {
        const lastIndex = this.getPageIndexes().length ? this.getPageIndexes().length - 1 : 0;
        const firstIndex = 0;

        if (index >= firstIndex || index <= lastIndex) {
            this.currentIndex$.next(index);

            return;
        }

        if (index < firstIndex) {
            this.currentIndex$.next(firstIndex);

            return;
        }

        if (index > lastIndex) {
            this.currentIndex$.next(lastIndex);
        }
    }
}
