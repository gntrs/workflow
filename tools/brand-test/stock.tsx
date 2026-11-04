// stock tailwind classes: hits under brand-stock-none.md, clean under brand-stock.md, which names them
export const Stock = () => <div className="rounded-lg shadow-sm bg-blue-600 text-white">x</div>;
export const More = () => <p className="rounded-sm bg-emerald-700/90">y</p>;
export const Bare = () => <div className="rounded shadow md:rounded-t">z</div>;
// a comment about rounded corners and a shadow is not a class
export const Cn = () => <div className={cn("rounded shadow p-4", ok && "border")}>c</div>;
