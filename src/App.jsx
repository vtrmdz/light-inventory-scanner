import { useState, useCallback } from 'react';
import Header from './components/Header';
import BarcodeScanner from './components/BarcodeScanner';
import Toast from './components/Toast';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import PartForm from './pages/PartForm';
import PartsList from './pages/PartsList';

const SESSION_KEY = 'parts-vault-unlocked';

export default function App() {
  const [unlocked, setUnlocked] = useState(() => {
    try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch { return false; }
  });

  const [lang, setLang] = useState('en');
  const [screen, setScreen] = useState('home');
  const [scanPurpose, setScanPurpose] = useState('form');

  const [activeBarcode, setActiveBarcode] = useState(null);
  const [activePart, setActivePart] = useState(null);
  const [scanPhoto, setScanPhoto] = useState(null); // { dataUrl, file } from scanner

  const [sessionCount, setSessionCount] = useState(0);
  const [listRefresh, setListRefresh] = useState(0);
  const [lastLocation, setLastLocation] = useState('');

  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const handleUnlock = () => {
    setUnlocked(true);
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch {}
  };

  if (!unlocked) {
    return <LoginPage onUnlock={handleUnlock} lang={lang} setLang={setLang} />;
  }

  const goHome = () => {
    setScreen('home');
    setActiveBarcode(null);
    setActivePart(null);
    setScanPhoto(null);
  };

  const openScanner = (purpose = 'form') => {
    setScanPurpose(purpose);
    setScreen('scan');
  };

  const openList = () => {
    setScreen('list');
  };

  const handleBarcodeDetected = (code, imageDataUrl, imageFile) => {
    setActiveBarcode(code);
    setActivePart(null);
    if (imageDataUrl && imageFile) {
      setScanPhoto({ dataUrl: imageDataUrl, file: imageFile });
    } else {
      setScanPhoto(null);
    }
    setScreen('form');
  };

  const handleSelectPartFromList = (part) => {
    setActivePart(part);
    setActiveBarcode(part.barcode);
    setScanPhoto(null);
    setScreen('form');
  };

  const handleSaved = (result) => {
    setSessionCount((c) => c + 1);
    if (result?.location) setLastLocation(result.location);
    setListRefresh((r) => r + 1);
    goHome();
  };

  const handleDeleted = () => {
    setListRefresh((r) => r + 1);
    goHome();
  };

  if (screen === 'scan') {
    return (
      <BarcodeScanner
        onDetected={handleBarcodeDetected}
        onClose={() => setScreen(scanPurpose === 'search' ? 'list' : 'home')}
      />
    );
  }

  return (
    <div className="page">
      <Header
        sessionCount={sessionCount}
        onOpenList={openList}
        onOpenScanner={() => openScanner('form')}
        lang={lang}
        setLang={setLang}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {screen === 'home' && (
          <HomePage
            sessionCount={sessionCount}
            onScan={() => openScanner('form')}
            onOpenList={openList}
            lang={lang}
          />
        )}

        {screen === 'form' && (
          <PartForm
            key={activeBarcode + (activePart?.id || '')}
            barcode={activeBarcode}
            existingPart={activePart}
            scanPhoto={scanPhoto}
            lastLocation={lastLocation}
            onSaved={handleSaved}
            onBack={goHome}
            onDeleted={handleDeleted}
            showToast={showToast}
            lang={lang}
          />
        )}

        {screen === 'list' && (
          <PartsList
            onSelectPart={handleSelectPartFromList}
            onBack={goHome}
            onScan={() => openScanner('search')}
            refreshTrigger={listRefresh}
            lang={lang}
          />
        )}
      </div>

      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
