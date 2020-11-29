import styled from '@emotion/styled';
import { css } from '@emotion/css';
import { useState } from 'react';
import { BaseElementAttributes } from './utils';

/**
 * The data format of each row of the list item
 */
export type ListViewItemData<T> = { key: T; content: React.ReactNode };

interface ListViewMethods<T> {
    selectAll(): void;
    getSelectedItems(): T[];
}

type ListViewProps<T> = BaseElementAttributes & {
    title: string;
    items: ListViewItemData<T>[];
    onSelected: (keys: T[]) => void;
    onContextMenu?: (
        event: React.MouseEvent<HTMLDivElement, MouseEvent>,
        keys: T[],
        methods: ListViewMethods<T>
    ) => void;
    onKeyDown?: (
        event: React.KeyboardEvent<HTMLDivElement>,
        methods: ListViewMethods<T>
    ) => void;
};

/**
 * ListView
 */
export function ListView<T>({
    title,
    items,
    onSelected,
    onContextMenu,
    onKeyDown,
    ...props
}: ListViewProps<T>) {
    const [selectedState, setSelectedState] = useState<T[]>([]);

    // Check the keys are all unique
    const unique = new Map<T, boolean>();
    const areAllUnique = items.every((v) => {
        if (unique.get(v.key)) {
            return false;
        }
        unique.set(v.key, true);
        return true;
    });
    if (!areAllUnique) {
        return (
            <ListViewRoot {...props}>
                <ListViewTitle>{title}</ListViewTitle>
                <ListViewItemList>The key must be unique</ListViewItemList>
            </ListViewRoot>
        );
    }

    // Normal
    return (
        <ListViewRoot
            {...props}
            tabIndex={0}
            onMouseEnter={(evt) => {
                evt.currentTarget.focus();
            }}
            onKeyDown={onKeyDownHandle}
        >
            <ListViewTitle>{title}</ListViewTitle>
            <ListViewItemList>
                {items.map((v, i) => {
                    let isSelected = selectedState.includes(v.key);
                    return (
                        <ListViewItem
                            key={i}
                            className={isSelected ? 'selected' : ''}
                            onClick={onItemClick(v)}
                            onContextMenu={onItemContextMenu(v)}
                        >
                            {v.content}
                        </ListViewItem>
                    );
                })}
            </ListViewItemList>
        </ListViewRoot>
    );

    /**
     * Create methods of ListView
     */
    function createMethods(): ListViewMethods<T> {
        return {
            /**
             * Select all items
             */
            selectAll(): void {
                const list = items.map((v) => v.key);
                setSelectedState(list);
                onSelected(list);
            },
            /**
             * Return selected key of items
             */
            getSelectedItems() {
                return [...selectedState];
            },
        };
    }

    /**
     * onKeyDown
     */
    function onKeyDownHandle(evt: React.KeyboardEvent<HTMLDivElement>) {
        if (onKeyDown) {
            onKeyDown(evt, createMethods());
        }
    }

    /**
     * On right click the ListViewItem
     */
    function onItemContextMenu(v: ListViewItemData<T>) {
        return (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            if (onContextMenu) {
                if (!selectedState.includes(v.key)) {
                    const list = [v.key];
                    setSelectedState(list);
                    onSelected(list);
                    onContextMenu(event, list, createMethods());
                } else {
                    onContextMenu(event, [...selectedState], createMethods());
                }
            }
        };
    }

    /**
     * On click the ListViewItem
     */
    function onItemClick(v: ListViewItemData<T>) {
        return (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            if (event.ctrlKey && selectedState.length > 0) {
                // Select multiple items on Ctrl + Left Click
                if (selectedState.includes(v.key)) {
                    selectedState.splice(selectedState.indexOf(v.key), 1);
                    const list = [...selectedState];
                    setSelectedState(list);
                    onSelected(list);
                } else {
                    const list = [...selectedState, v.key];
                    setSelectedState(list);
                    onSelected(list);
                }
            } else if (event.shiftKey && selectedState.length > 0) {
                // Select continuous multiple items on Shift + Left Click
                let i = items.findIndex((v2) => selectedState.includes(v2.key));
                let vi = items.findIndex((v2) => v2.key === v.key);
                const list = [];
                if (vi < i) {
                    list.push(
                        ...items.slice(vi, i).map((v) => v.key),
                        ...selectedState
                    );
                } else if (vi > i) {
                    let j = Array.from(items)
                        .reverse()
                        .findIndex(
                            (v2) => selectedState.includes(v2.key) || v2.key === v.key
                        );
                    j = items.length - j - 1;
                    list.push(...items.slice(i, j + 1).map((v) => v.key));
                }
                setSelectedState(list);
                onSelected(list);
            } else {
                // Select single item on Left Click
                const list = [v.key];
                setSelectedState(list);
                onSelected(list);
            }
        };
    }
}

const ListViewRoot = styled.div`
    display: flex;
    flex-direction: column;
    border: 1px solid var(--vscode-panel-border);
    flex-shrink: 0;
    user-select: none;
    border-radius: var(--panel-border-radius);
    background: var(--vscode-editorWidget-background);
    outline: none;
`;

const ListViewTitle = styled.div`
    color: var(--vscode-panelTitle-activeForeground);
    font-size: 16px;
    padding: 8px 20px;
    user-select: none;
    border-bottom: 1px solid var(--vscode-panel-border);
    text-align: center;
`;

const ListViewItemList = styled.div`
    display: flex;
    flex-direction: column;
`;

const ListViewItem = styled.div`
    padding: 5px;
    cursor: pointer;
    position: relative;

    &:hover {
        color: var(--vscode-list-hoverForeground);
        background: var(--vscode-list-hoverBackground);
    }

    &.selected {
        color: var(--vscode-list-focusForeground);
        background: var(--vscode-list-focusBackground);
    }
`;