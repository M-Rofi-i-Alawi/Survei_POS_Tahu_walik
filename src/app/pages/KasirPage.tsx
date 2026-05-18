import { useState, useRef } from "react";
import { Plus, Minus, Trash2, Wallet, QrCode, Search, AlertTriangle, Check, X, Printer, User } from "lucide-react";
import { useApp, Transaction } from "../context/AppContext";

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
  photoUrl: string;
}

export default function KasirPage() {
  const { products, getSisaStok, addTransaction, qrisConfig, confirmQris, storeConfig } = useApp();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [pendingTrxId, setPendingTrxId] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTrx, setLastTrx] = useState<Transaction | null>(null);
  const [lastTotal, setLastTotal] = useState(0);
  const receiptRef = useRef<HTMLDivElement>(null);

  const addToCart = (product: typeof products[0]) => {
    const sisa = getSisaStok(product.id);
    const inCart = cart.find((c) => c.productId === product.id)?.quantity || 0;
    if (inCart >= sisa) return;
    const existing = cart.find((c) => c.productId === product.id);
    if (existing) {
      setCart(cart.map((c) => c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { productId: product.id, productName: product.name, price: product.price, quantity: 1, image: product.image, photoUrl: product.photoUrl || "" }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    if (delta > 0) {
      const sisa = getSisaStok(productId);
      const inCart = cart.find((c) => c.productId === productId)?.quantity || 0;
      if (inCart >= sisa) return;
    }
    setCart(cart.map((c) => c.productId === productId ? { ...c, quantity: c.quantity + delta } : c).filter((c) => c.quantity > 0));
  };

  const total = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handlePayTunai = () => {
    if (cart.length === 0) return;
    const items = cart.map((c) => ({ productId: c.productId, productName: c.productName, quantity: c.quantity, price: c.price, subtotal: c.price * c.quantity }));
    const trx = addTransaction(items, "tunai", buyerName || "Umum");
    setLastTrx(trx);
    setLastTotal(total);
    setShowReceipt(true);
    setCart([]);
    setBuyerName("");
  };

  const handlePayQris = () => {
    if (cart.length === 0) return;
    const items = cart.map((c) => ({ productId: c.productId, productName: c.productName, quantity: c.quantity, price: c.price, subtotal: c.price * c.quantity }));
    const trx = addTransaction(items, "qris", buyerName || "Umum");
    setPendingTrxId(trx.id);
    setLastTrx(trx);
    setLastTotal(total);
    setShowQrisModal(true);
    setCart([]);
  };

  const handleConfirmQris = () => {
    if (pendingTrxId) {
      confirmQris(pendingTrxId);
      setPendingTrxId(null);
      setShowQrisModal(false);
      setShowReceipt(true);
    }
  };

  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open("", "_blank", "width=300,height=600");
      if (printWindow) {
        printWindow.document.write(`<html><head><title>Struk</title><style>body{font-family:monospace;font-size:12px;padding:10px;max-width:280px;margin:0 auto}h2{text-align:center;margin:0}p{margin:2px 0}.line{border-top:1px dashed #000;margin:8px 0}.item{display:flex;justify-content:space-between}.right{text-align:right}.center{text-align:center}</style></head><body>`);
        printWindow.document.write(receiptRef.current.innerHTML);
        printWindow.document.write("</body></html>");
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const renderProductImg = (product: typeof products[0]) => {
    if (product.photoUrl) {
      return <img src={product.photoUrl} alt={product.name} className="w-16 h-16 rounded-xl object-cover mx-auto mb-2" />;
    }
    return <div className="text-5xl mb-3 text-center">{product.image}</div>;
  };

  const renderCartImg = (item: CartItem) => {
    if (item.photoUrl) {
      return <img src={item.photoUrl} alt={item.productName} className="w-10 h-10 rounded-lg object-cover" />;
    }
    return <div className="text-2xl w-10 h-10 flex items-center justify-center">{item.image}</div>;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full relative">
      {/* Left Side - Products */}
      <div className="flex-1 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input type="text" placeholder="Cari produk..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const sisa = getSisaStok(product.id);
            const isOut = sisa <= 0 && product.stokHarian > 0;
            return (
              <button key={product.id} onClick={() => addToCart(product)} disabled={isOut} className={`bg-white rounded-2xl p-4 border text-left transition-all group relative overflow-hidden ${isOut ? "border-red-200 opacity-60 cursor-not-allowed" : "border-border hover:border-[#FBAA31] hover:shadow-lg hover:shadow-[#FBAA31]/10"}`}>
                {isOut && (
                  <div className="absolute inset-0 bg-red-50/80 flex items-center justify-center z-10">
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-full"><AlertTriangle className="w-3 h-3" />HABIS</div>
                  </div>
                )}
                {renderProductImg(product)}
                <h3 className="font-semibold text-sm mb-1 group-hover:text-[#E87428] transition-colors">{product.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <p className="font-bold text-[#E87428]">Rp {product.price.toLocaleString("id-ID")}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sisa <= 5 && sisa > 0 ? "bg-yellow-50 text-yellow-600" : sisa <= 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>Sisa: {sisa}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Side - Cart */}
      <div className="w-full lg:w-96 bg-white rounded-2xl border border-border p-6 flex flex-col h-fit lg:sticky lg:top-20">
        <h2 className="text-xl font-bold mb-4">🛒 Keranjang</h2>

        {/* Buyer Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Nama Pembeli</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Kosongkan jika umum" className="w-full pl-9 pr-4 py-2.5 bg-muted/30 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FBAA31]/30" />
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto max-h-48 mb-4 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground"><p className="text-3xl mb-1">🛒</p><p className="text-sm">Keranjang kosong</p></div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="flex items-center gap-2 p-2.5 bg-muted/30 rounded-xl">
                {renderCartImg(item)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">Rp {item.price.toLocaleString("id-ID")} × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQuantity(item.productId, -1)} className="w-6 h-6 rounded-lg bg-muted hover:bg-muted/70 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                  <span className="w-6 text-center font-semibold text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, 1)} className="w-6 h-6 rounded-lg bg-[#FBAA31] hover:bg-[#E87428] flex items-center justify-center"><Plus className="w-3 h-3 text-white" /></button>
                  <button onClick={() => setCart(cart.filter((c) => c.productId !== item.productId))} className="w-6 h-6 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center ml-1"><Trash2 className="w-3 h-3 text-red-500" /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border pt-3 mb-3">
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-[#E87428]">Rp {total.toLocaleString("id-ID")}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handlePayTunai} disabled={cart.length === 0} className="py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2"><Wallet className="w-5 h-5" />Tunai</button>
            <button onClick={handlePayQris} disabled={cart.length === 0} className="py-3 bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2"><QrCode className="w-5 h-5" />QRIS</button>
          </div>
          <button onClick={() => { setCart([]); setBuyerName(""); }} disabled={cart.length === 0} className="w-full py-2 bg-muted text-foreground font-medium rounded-xl hover:bg-muted/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm">Reset</button>
        </div>
      </div>

      {/* QRIS Modal */}
      {showQrisModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FBAA31] to-[#E87428] flex items-center justify-center mx-auto mb-4"><QrCode className="w-8 h-8 text-white" /></div>
            <h3 className="text-2xl font-bold mb-1">Pembayaran QRIS</h3>
            <p className="text-sm text-muted-foreground mb-1">Pembeli: <span className="font-semibold text-foreground">{lastTrx?.buyerName || "Umum"}</span></p>
            <p className="text-muted-foreground mb-4 text-sm">Minta pembeli scan QR Code berikut</p>
            <div className="bg-muted/30 rounded-2xl p-6 mb-4">
              {qrisConfig.imageData ? (
                <img src={qrisConfig.imageData} alt="QRIS" className="w-48 h-48 mx-auto rounded-xl object-contain" />
              ) : (
                <div className="w-48 h-48 mx-auto bg-muted rounded-xl flex items-center justify-center"><div className="text-center"><QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-2" /><p className="text-xs text-muted-foreground">QR belum diupload</p></div></div>
              )}
            </div>
            <div className="bg-[#FBAA31]/10 rounded-xl p-4 mb-6">
              <p className="text-sm text-muted-foreground">Total yang harus dibayar</p>
              <p className="text-3xl font-bold text-[#E87428]">Rp {lastTotal.toLocaleString("id-ID")}</p>
              <p className="text-xs text-muted-foreground mt-1">{qrisConfig.accountName}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowQrisModal(false); setPendingTrxId(null); }} className="flex-1 py-3 bg-muted text-foreground font-semibold rounded-xl hover:bg-muted/70 transition-all flex items-center justify-center gap-2"><X className="w-4 h-4" />Batal</button>
              <button onClick={handleConfirmQris} className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl shadow-lg transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2"><Check className="w-4 h-4" />Konfirmasi Lunas</button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastTrx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">✅ Transaksi Berhasil</h3>
              <button onClick={() => setShowReceipt(false)} className="p-2 hover:bg-muted rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            {/* Printable receipt */}
            <div ref={receiptRef} className="bg-muted/20 rounded-xl p-4 mb-4 font-mono text-xs">
              <div className="text-center mb-3">
                <h2 style={{fontSize: "16px", fontWeight: "bold", margin: "0"}}>{storeConfig.name}</h2>
                <p>{storeConfig.address}</p>
                <p>Telp: {storeConfig.phone}</p>
                <div className="line" style={{borderTop: "1px dashed #999", margin: "8px 0"}} />
              </div>
              <div className="space-y-1 mb-2">
                <div className="item" style={{display: "flex", justifyContent: "space-between"}}><span>ID</span><span>{lastTrx.id.slice(0, 12)}</span></div>
                <div className="item" style={{display: "flex", justifyContent: "space-between"}}><span>Tanggal</span><span>{lastTrx.date} {lastTrx.time}</span></div>
                <div className="item" style={{display: "flex", justifyContent: "space-between"}}><span>Pembeli</span><span>{lastTrx.buyerName}</span></div>
                <div className="item" style={{display: "flex", justifyContent: "space-between"}}><span>Metode</span><span>{lastTrx.method === "tunai" ? "TUNAI" : "QRIS"}</span></div>
              </div>
              <div className="line" style={{borderTop: "1px dashed #999", margin: "8px 0"}} />
              {lastTrx.items.map((item, i) => (
                <div key={i} className="mb-1">
                  <p>{item.productName}</p>
                  <div className="item" style={{display: "flex", justifyContent: "space-between"}}>
                    <span>&nbsp;&nbsp;{item.quantity} x Rp {item.price.toLocaleString("id-ID")}</span>
                    <span>Rp {item.subtotal.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              ))}
              <div className="line" style={{borderTop: "1px dashed #999", margin: "8px 0"}} />
              <div className="item" style={{display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "14px"}}>
                <span>TOTAL</span>
                <span>Rp {lastTrx.total.toLocaleString("id-ID")}</span>
              </div>
              <div className="line" style={{borderTop: "1px dashed #999", margin: "8px 0"}} />
              <p className="center" style={{textAlign: "center"}}>Terima kasih!</p>
              <p className="center" style={{textAlign: "center"}}>~ {storeConfig.name} ~</p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowReceipt(false)} className="flex-1 py-3 bg-muted text-foreground font-semibold rounded-xl hover:bg-muted/70 transition-all text-sm">Tutup</button>
              <button onClick={handlePrint} className="flex-1 py-3 bg-gradient-to-r from-[#FBAA31] to-[#E87428] text-white font-semibold rounded-xl shadow-lg transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-sm"><Printer className="w-4 h-4" />Cetak Struk</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
