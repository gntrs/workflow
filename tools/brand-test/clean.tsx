// clean: brand values, var() refs, token values and keys, an allowed value. #ff00ff in this comment must not count.
const icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#ff0000" d="M0 0h24v24H0z"/></svg>';
const bg = 'url(#00ff00)';

const variants = [{ sku: 'a1', color: 'black' }, { sku: 'a2', color: 'Navy' }];
const label = 'border: red';

class Cart {
  #add() { return 1; }
}

/* block comment with rgb(1, 2, 3) */
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--ground)',
        color: '#f2f2f0',
        borderColor: 'hsl(216, 100%, 60%)',
        fontFamily: "Inter, system-ui, sans-serif",
        borderRadius: 8,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
        font: '400 16px Inter',
      }}
      className="rounded-[8px] text-[#1da1f2] bg-brand-500 text-ink bg-sky-500/80 rounded-lg rounded-t-lg rounded-full rounded-none rounded-card shadow-card shadow-none font-[Inter] font-[600]"
    >
      <p>Order #123 shipped, see issue #cafe and #bad for details.</p>
      <a href="#abc" style={{ color: '#1f9d55', fontFamily: ['ui-monospace', 'monospace'], borderRadius: '4px' }}>
        {children}
      </a>
      <Icon color="white" />
      <p>pick a color: red or blue</p>
      <p>Color: black. Black friday, white glove.</p>
      <p className="text-white bg-black/80 border-white">tailwind black and white, both in the brand</p>
      <div className="bg-[oklch(0.6_0.12_170)] bg-[rgb(0_102_255)]" />
      <b style={{ color: '#3b82f6' }}>{/* brand-check-ignore: a partner color, fixed by contract */}</b>
      {/* brand-check-ignore */}
      <i style={{ color: '#e4002b' }} />
      <svg width="12" height="12"><circle fill="#ff0000" r="6" /></svg>
    </div>
  );
}
