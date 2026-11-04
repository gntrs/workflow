// planted: tailwind palette, arbitrary font, radius and shadow names, js style values, a hex in a value position
export const Bad = () => (
  <div className="bg-blue-500 text-red-600/50 hover:border-zinc-200 font-['Comic_Sans_MS'] rounded-xl shadow-lg shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
    <p>Order #123 is late, issue #cafe</p>
    <span style={{ color: 'red', font: '600 15px Papyrus', background: 'oklch(0.7 0.1 200)' }} />
    <span style={{ stroke: '#ff00aa', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)' }} />
  </div>
);
