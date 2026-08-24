import { useId, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import classes from './Tabs.module.scss';

export function Tabs<T extends string>({
  label,
  value,
  items,
  onChange,
  children,
}: {
  label: string;
  value: T;
  items: ReadonlyArray<readonly [T, string]>;
  onChange: (value: T) => void;
  children: ReactNode;
}) {
  const instanceId = useId();
  const tabsRef = useRef(new Map<T, HTMLButtonElement>());
  const activeIndex = Math.max(
    0,
    items.findIndex(([id]) => id === value),
  );
  const activeId = items[activeIndex]?.[0];
  const safeId = (id: T) => `${instanceId}-${id}`.replaceAll(':', '');
  const select = (index: number) => {
    const item = items[(index + items.length) % items.length];
    if (!item) return;
    onChange(item[0]);
    tabsRef.current.get(item[0])?.focus();
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const commands: Partial<Record<string, number>> = {
      ArrowRight: activeIndex + 1,
      ArrowDown: activeIndex + 1,
      ArrowLeft: activeIndex - 1,
      ArrowUp: activeIndex - 1,
      Home: 0,
      End: items.length - 1,
    };
    const nextIndex = commands[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    select(nextIndex);
  };

  return (
    <>
      <div className={classes.tabs} role="tablist" aria-label={label}>
        {items.map(([id, text]) => {
          const selected = value === id;
          return (
            <button
              ref={(element) => {
                if (element) tabsRef.current.set(id, element);
                else tabsRef.current.delete(id);
              }}
              type="button"
              role="tab"
              key={id}
              id={`${safeId(id)}-tab`}
              className={`${classes.tab} ${selected ? classes.active : ''}`}
              aria-selected={selected}
              aria-controls={`${safeId(id)}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(id)}
              onKeyDown={handleKeyDown}
            >
              {text}
            </button>
          );
        })}
      </div>
      {activeId && (
        <div
          role="tabpanel"
          id={`${safeId(activeId)}-panel`}
          aria-labelledby={`${safeId(activeId)}-tab`}
          tabIndex={0}
        >
          {children}
        </div>
      )}
    </>
  );
}
