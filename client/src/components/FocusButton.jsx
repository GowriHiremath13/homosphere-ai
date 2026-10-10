import { forwardRef } from 'react';

// The base focusable primitive for the TV. Anything the remote should be able to select uses this.
const FocusButton = forwardRef(function FocusButton(
  { as: Tag = 'button', focusId, autoFocus, className = '', children, onSelect, ...rest },
  ref
) {
  return (
    <Tag
      ref={ref}
      data-focusable=""
      data-focus-id={focusId}
      data-autofocus={autoFocus ? '' : undefined}
      tabIndex={-1}
      className={`focusable ${className}`}
      onClick={onSelect}
      type={Tag === 'button' ? 'button' : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
});
export default FocusButton;
