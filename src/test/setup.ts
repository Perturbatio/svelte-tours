import { beforeEach, vi } from 'vitest'

export class TestResizeObserver implements ResizeObserver {
    static instances = new Set<TestResizeObserver>()
    private targets = new Set<Element>()

    constructor(private callback: ResizeObserverCallback) {
        TestResizeObserver.instances.add(this)
    }

    observe(target: Element) {
        this.targets.add(target)
    }

    unobserve(target: Element) {
        this.targets.delete(target)
    }

    disconnect() {
        this.targets.clear()
    }

    static resize(target: HTMLElement, width: number, height: number) {
        Object.defineProperties(target, {
            clientWidth: {configurable: true, value: width},
            clientHeight: {configurable: true, value: height}
        })
        const size = [{inlineSize: width, blockSize: height}]
        const entry: ResizeObserverEntry = {
            target, contentRect: new DOMRect(0, 0, width, height),
            borderBoxSize: size, contentBoxSize: size, devicePixelContentBoxSize: size
        }
        for (const observer of this.instances) {
            if (observer.targets.has(target)) observer.callback([entry], observer)
        }
    }
}

beforeEach(() => {
    if (typeof window !== 'undefined') {
        vi.stubGlobal('ResizeObserver', TestResizeObserver)
        vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (this: HTMLElement) {
            return this.classList.contains('item-picker-list') ? 320 : 0
        })
        vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
            return this.classList.contains('item-picker-grid') || this.classList.contains('item-picker-list') ? 600 : 0
        })
        vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
            return this.classList.contains('item-picker-row') ? 100 : 0
        })
        Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
            configurable: true,
            value(this: HTMLElement, options: ScrollToOptions | number = {}, y?: number) {
                if (typeof options === 'object') {
                    this.scrollTop = options.top ?? this.scrollTop
                    this.scrollLeft = options.left ?? this.scrollLeft
                } else {
                    this.scrollLeft = options
                    this.scrollTop = y ?? 0
                }
                this.dispatchEvent(new Event('scroll'))
            }
        })
    }
})
