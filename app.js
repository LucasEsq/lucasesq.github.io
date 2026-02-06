try {
  const rootEl = document.getElementById("root");
  const root = ReactDOM.createRoot(rootEl);
  root.render(<App />);
} catch (e) {
  console.error("Fatal render error:", e);
  document.getElementById("root").innerHTML =
    "<pre style='padding:16px;white-space:pre-wrap;color:red'>"
    + e.stack
    + "</pre>";
}