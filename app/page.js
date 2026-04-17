const sampleRows = [
  { product: "iPhone 13", purchase: "05.06.2022", status: "Active", expires: "8 Months" },
  { product: "Samsung TV", purchase: "05.16.2023", status: "Expiring Soon", expires: "5 Days" },
  { product: "Dell Laptop", purchase: "05.16.2021", status: "Expired", expires: "Expired" },
  { product: "Canon Camera", purchase: "05.16.2020", status: "Active", expires: "1 Year" },
];

export default function HomePage() {
  return (
    <main className="vault-wrap">
      <div className="vault-orb orb-a" />
      <div className="vault-orb orb-b" />

      <section className="vault-shell hero-shell">
        <nav className="vault-nav">
          <div className="vault-brand">➤ FixVault</div>
          <div className="vault-links">
            <a href="#">Dashboard</a>
            <a href="#">Add Product</a>
            <a href="#">My Warranties</a>
          </div>
          <button className="btn ghost">Sign In</button>
        </nav>

        <header className="hero-copy">
          <h1>Never Lose Your Warranty Again</h1>
          <p>Store, track and manage all your warranties in one place</p>
          <div className="hero-actions">
            <button className="btn primary">Get Started</button>
            <button className="btn ghost">Watch Demo</button>
          </div>
        </header>

        <div className="feature-grid">
          <article className="feature-card">
            <strong>Upload Bills</strong>
            <span>Easily upload and store receipts securely.</span>
          </article>
          <article className="feature-card">
            <strong>Expiry Reminders</strong>
            <span>Get notified before warranty expiration.</span>
          </article>
          <article className="feature-card">
            <strong>Repair Services</strong>
            <span>Find trusted nearby repair providers.</span>
          </article>
        </div>
      </section>

      <section className="vault-shell dashboard-shell">
        <aside className="left-rail">
          <h3>➤ FixVault</h3>
          <button className="rail-link active">Dashboard</button>
          <button className="rail-link">Add Product</button>
          <button className="rail-link">My Warranties</button>
          <button className="rail-link">Settings</button>
        </aside>

        <div className="dashboard-main">
          <div className="dashboard-head">
            <h2>Dashboard</h2>
            <div className="dash-icons">⌕  ⚪  ☰</div>
          </div>

          <div className="stats-grid">
            <article><b>152</b><span>Total Products</span></article>
            <article><b>8</b><span>Expiring Soon</span></article>
            <article><b>45</b><span>Active Warranties</span></article>
          </div>

          <div className="table-card">
            <div className="table-head">
              <h3>My Warranties</h3>
              <div className="table-tools"><input placeholder="Search" /><button>Sort ▾</button></div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Purchase Date</th>
                  <th>Warranty Status</th>
                  <th>Expires In</th>
                </tr>
              </thead>
              <tbody>
                {sampleRows.map((row) => (
                  <tr key={row.product}>
                    <td>{row.product}</td>
                    <td>{row.purchase}</td>
                    <td><span className={`status ${row.status.toLowerCase().replace(" ", "-")}`}>{row.status}</span></td>
                    <td>{row.expires}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="vault-shell add-shell">
        <aside className="left-rail">
          <h3>➤ FixVault</h3>
          <button className="rail-link active">Dashboard</button>
          <button className="rail-link">Add Product</button>
          <button className="rail-link">My Warranties</button>
          <button className="rail-link">Settings</button>
        </aside>

        <div className="dashboard-main">
          <h2>Add New Product</h2>
          <form className="add-form">
            <label>
              Product Name
              <input type="text" placeholder="Enter product" />
            </label>
            <label>
              Brand
              <select><option>Select brand</option></select>
            </label>
            <label>
              Purchase Date
              <input type="date" />
            </label>
            <label>
              Warranty Period
              <select><option>Select duration</option></select>
            </label>
            <label className="dropzone">
              <span>Drag and drop or Browse</span>
            </label>
            <button type="button" className="btn primary save-btn">Save Product</button>
          </form>
        </div>
      </section>
    </main>
  );
}
