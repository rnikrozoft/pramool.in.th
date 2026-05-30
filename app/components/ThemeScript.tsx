/** Runs before paint to avoid light-mode flash when user prefers dark. */
export default function ThemeScript() {
  const script = `(function(){try{var k='pramool-theme';var t=localStorage.getItem(k);var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`

  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
