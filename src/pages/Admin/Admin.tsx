import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Server, Terminal, FileImage } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import styles from './Admin.module.css';

export const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { publishBook } = useUser();

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Form states matching DB columns
  const [seriesTitle, setSeriesTitle] = useState('');
  const [seriesDesc, setSeriesDesc] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [pagesCount, setPagesCount] = useState(8);
  const [cost, setCost] = useState(0);

  // Pipeline states
  const [pipelineStep, setPipelineStep] = useState<number>(0); // 0: idle, 1-4: steps, 5: completed
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    '[SYSTEM] Digital DRM Compiler status: IDLE',
    '[SYSTEM] Ready for PDF, ZIP, CBZ, CBR imports.'
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string, type: 'info' | 'success' | 'warn' = 'info') => {
    const time = new Date().toLocaleTimeString();
    const formatted = `[${time}] [${type.toUpperCase()}] ${msg}`;
    setConsoleLogs(prev => [...prev, formatted]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    setFileSize((file.size / (1024 * 1024)).toFixed(2));
    addLog(`Buffer imported asset: ${file.name}`, 'info');
    addLog(`Parsed size: ${(file.size / (1024 * 1024)).toFixed(2)} MB. Type: ${file.name.split('.').pop()?.toUpperCase()}`, 'info');
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName) return;

    setPipelineStep(1);
    addLog('DRM Pipeline secure extraction initialized...', 'warn');

    // Sequence Step 1
    setTimeout(() => {
      setPipelineStep(2);
      addLog(`Extraction complete. Parsed ${pagesCount} page blocks from file.`, 'success');
      addLog('Optimizing image resolutions (Converting JPEG to webp)...', 'info');

      // Sequence Step 2
      setTimeout(() => {
        setPipelineStep(3);
        addLog('WebP image optimization completed. compression ratio: 84%', 'success');
        addLog('Applying cryptographic DRM protection blocks (AES-256)...', 'warn');

        // Sequence Step 3
        setTimeout(() => {
          setPipelineStep(4);
          addLog('DRM encryption successfully locked. Security wrapper signed.', 'success');
          addLog('Compiling layouts, blurred overlays, and metadata headers...', 'info');

          // Sequence Step 4
          setTimeout(() => {
            setPipelineStep(5);
            addLog('DRM compiler success! Publishing metadata manifest...', 'success');

            // Insert into the simulated database tables
            publishBook(seriesTitle, bookTitle, chapterTitle, pagesCount, cost);
            
            setTimeout(() => {
              navigate('/');
            }, 1200);

          }, 1500);
        }, 1500);
      }, 1500);
    }, 1500);
  };

  return (
    <div className={styles.admin}>
      <div className="main-container">
        <h2>Creator Studio</h2>
        <p className={styles.subtitle}>Upload and publish digital manga assets directly into the database catalog tables.</p>

        <div className={styles.layout}>
          {/* Column 1: Upload Dropzone & Metadata fields Form */}
          <div className={`${styles.formCard} glass`}>
            <h3><UploadCloud size={20} /> Publish Manga Chapter</h3>

            {/* Drag & Drop Zone */}
            <div 
              className={`${styles.dropzone} ${isDragOver ? styles.dragover : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: 'none' }}
                accept=".pdf,.zip,.cbz,.cbr"
              />
              <FileImage size={40} className={styles.dropIcon} />
              {fileName ? (
                <div className={styles.dropText}>
                  File Loaded: <strong className={styles.fileName}>{fileName}</strong> ({fileSize} MB)
                </div>
              ) : (
                <div className={styles.dropText}>
                  Drag & drop <span>PDF / ZIP / CBZ</span> or click to browse
                </div>
              )}
              <span className={styles.dropHint}>DRM encryption supports up to 150MB</span>
            </div>

            <form onSubmit={handleUploadSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label>Manga Series Title</label>
                  <input type="text" placeholder="e.g. Solo Leveling Reborn" value={seriesTitle} onChange={(e) => setSeriesTitle(e.target.value)} required />
                </div>
                <div className={styles.inputGroup}>
                  <label>Book / Volume Title</label>
                  <input type="text" placeholder="e.g. Volume 1: Reality Cracks" value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} required />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label>Chapter Title</label>
                  <input type="text" placeholder="e.g. Chapter 1: The Awakening" value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} required />
                </div>
                <div className={styles.inputGroup}>
                  <label>Total Pages</label>
                  <input type="number" min={1} value={pagesCount} onChange={(e) => setPagesCount(parseInt(e.target.value))} required />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label>Chapter Cost</label>
                  <select value={cost} onChange={(e) => setCost(parseInt(e.target.value))}>
                    <option value="0">Free Chapter (0 Coins)</option>
                    <option value="1">1 Coin</option>
                    <option value="2">2 Coins</option>
                  </select>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Series Synopsis Description</label>
                <textarea rows={3} placeholder="Enter plot summary synopsis..." value={seriesDesc} onChange={(e) => setSeriesDesc(e.target.value)} required />
              </div>

              <button 
                type="submit" 
                className={styles.btnPublish}
                disabled={!fileName || pipelineStep > 0}
              >
                Publish and Compile Chapter
              </button>
            </form>
          </div>

          {/* Column 2: DRM Pipeline monitor terminal logs */}
          <div className={`${styles.consoleCard} glass`}>
            <h3><Server size={20} /> Security & Compression Pipeline</h3>

            <div className={styles.stepsWrapper}>
              {/* Step 1 */}
              <div className={`${styles.stepRow} ${pipelineStep === 1 ? styles.activeStep : ''} ${pipelineStep > 1 ? styles.completedStep : ''}`}>
                <div className={styles.stepDot}>1</div>
                <div className={styles.stepInfo}>
                  <div className={styles.stepName}>Page Parser Extraction</div>
                  <div className={styles.stepStatus}>
                    {pipelineStep === 1 ? 'Parsing pages...' : pipelineStep > 1 ? 'Complete' : 'Pending'}
                  </div>
                </div>
              </div>
              {/* Step 2 */}
              <div className={`${styles.stepRow} ${pipelineStep === 2 ? styles.activeStep : ''} ${pipelineStep > 2 ? styles.completedStep : ''}`}>
                <div className={styles.stepDot}>2</div>
                <div className={styles.stepInfo}>
                  <div className={styles.stepName}>WebP Optimization</div>
                  <div className={styles.stepStatus}>
                    {pipelineStep === 2 ? 'Optimizing sizes...' : pipelineStep > 2 ? 'Complete' : 'Pending'}
                  </div>
                </div>
              </div>
              {/* Step 3 */}
              <div className={`${styles.stepRow} ${pipelineStep === 3 ? styles.activeStep : ''} ${pipelineStep > 3 ? styles.completedStep : ''}`}>
                <div className={styles.stepDot}>3</div>
                <div className={styles.stepInfo}>
                  <div className={styles.stepName}>AES-256 DRM Encryption</div>
                  <div className={styles.stepStatus}>
                    {pipelineStep === 3 ? 'Cryptograph locks...' : pipelineStep > 3 ? 'Complete' : 'Pending'}
                  </div>
                </div>
              </div>
              {/* Step 4 */}
              <div className={`${styles.stepRow} ${pipelineStep === 4 ? styles.activeStep : ''} ${pipelineStep > 4 ? styles.completedStep : ''}`}>
                <div className={styles.stepDot}>4</div>
                <div className={styles.stepInfo}>
                  <div className={styles.stepName}>Thumbnails & Overlays</div>
                  <div className={styles.stepStatus}>
                    {pipelineStep === 4 ? 'Generating cards...' : pipelineStep > 4 ? 'Complete' : 'Pending'}
                  </div>
                </div>
              </div>
            </div>

            {/* Logging terminal window */}
            <div className={styles.logsTerminal}>
              <div className={styles.terminalHeader}>
                <Terminal size={14} /> <span>DRM SECURE PIPELINE MONITOR</span>
              </div>
              <div className={styles.terminalBody}>
                {consoleLogs.map((log, idx) => (
                  <div key={idx} className={styles.logLine}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
