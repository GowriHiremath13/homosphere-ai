export default function Panel({ title, icon, action, className = '', children, ...rest }) {
  return (
    <section className={`panel ${className}`} {...rest}>
      {title && (
        <div className="panel-head">
          <h2>{icon}{title}</h2>
          {action}
        </div>
      )}
      <div className="panel-body">{children}</div>
    </section>
  );
}
