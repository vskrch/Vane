import { Metadata } from 'next';
import Link from 'next/link';
import { Download, ExternalLink, Globe, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Browser Extensions - Perplexica',
  description: 'Install Perplexica browser extensions for faster search',
};

const ExtensionsPage = () => {
  return (
    <div className="min-h-screen bg-light-primary dark:bg-dark-primary">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-black/70 dark:text-white/70 hover:opacity-70 mb-8"
        >
          <ArrowLeft size={20} />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-4 text-black dark:text-white">
          Browser Extensions
        </h1>
        <p className="text-lg text-black/70 dark:text-white/70 mb-8">
          Install Perplexica extensions to search directly from your browser. 
          Get instant answers without opening the app.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Chrome Extension */}
          <div className="bg-light-secondary dark:bg-dark-secondary rounded-lg p-6 border border-light-200 dark:border-dark-200">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="text-blue-500" size={32} />
              <div>
                <h2 className="text-xl font-semibold text-black dark:text-white">
                  Chrome Extension
                </h2>
                <p className="text-sm text-black/60 dark:text-white/60">
                  For Chrome, Edge, Brave
                </p>
              </div>
            </div>
            
            <ul className="space-y-2 mb-6 text-black/70 dark:text-white/70">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Add Perplexica to your browser search</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Right-click to search selected text</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Fast access from toolbar</span>
              </li>
            </ul>

            <a
              href="/extensions/chrome-manifest.json"
              download="manifest.json"
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-200 w-full justify-center"
            >
              <Download size={18} />
              Download for Chrome
            </a>

            <div className="mt-4 p-3 bg-light-200 dark:bg-dark-200 rounded text-sm text-black/70 dark:text-white/70">
              <strong>Installation:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Download the extension</li>
                <li>Open Chrome → Extensions → Manage Extensions</li>
                <li>Enable "Developer mode"</li>
                <li>Click "Load unpacked" and select the folder</li>
              </ol>
            </div>
          </div>

          {/* Firefox Extension */}
          <div className="bg-light-secondary dark:bg-dark-secondary rounded-lg p-6 border border-light-200 dark:border-dark-200">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="text-orange-500" size={32} />
              <div>
                <h2 className="text-xl font-semibold text-black dark:text-white">
                  Firefox Extension
                </h2>
                <p className="text-sm text-black/60 dark:text-white/60">
                  For Firefox and forks
                </p>
              </div>
            </div>
            
            <ul className="space-y-2 mb-6 text-black/70 dark:text-white/70">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Add Perplexica search engine</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Context menu search</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">•</span>
                <span>Quick access from toolbar</span>
              </li>
            </ul>

            <a
              href="/extensions/firefox-manifest.json"
              download="manifest.json"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition duration-200 w-full justify-center"
            >
              <Download size={18} />
              Download for Firefox
            </a>

            <div className="mt-4 p-3 bg-light-200 dark:bg-dark-200 rounded text-sm text-black/70 dark:text-white/70">
              <strong>Installation:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Download the extension</li>
                <li>Open Firefox → about:debugging</li>
                <li>Click "This Firefox" → "Load Temporary Add-on"</li>
                <li>Select the manifest.json file</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Alternative: Search Engine Setup */}
        <div className="mt-8 bg-light-secondary dark:bg-dark-secondary rounded-lg p-6 border border-light-200 dark:border-dark-200">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
            Alternative: Add as Search Engine
          </h2>
          <p className="text-black/70 dark:text-white/70 mb-4">
            You can also add Perplexica as a custom search engine in your browser settings:
          </p>
          
          <div className="space-y-4">
            <div className="p-4 bg-light-200 dark:bg-dark-200 rounded">
              <h3 className="font-medium text-black dark:text-white mb-2">
                Chrome/Edge:
              </h3>
              <ol className="list-decimal list-inside text-black/70 dark:text-white/70 space-y-1">
                <li>Go to Settings → Search engine → Manage search engines</li>
                <li>Click "Add" under "Site search"</li>
                <li>Name: <code className="bg-light-primary dark:bg-dark-primary px-2 py-0.5 rounded">Perplexica</code></li>
                <li>Shortcut: <code className="bg-light-primary dark:bg-dark-primary px-2 py-0.5 rounded">perplexica</code></li>
                <li>URL: <code className="bg-light-primary dark:bg-dark-primary px-2 py-0.5 rounded block mt-1">https://perplexica-9d84002fd261.herokuapp.com/search?q=%s</code></li>
              </ol>
            </div>

            <div className="p-4 bg-light-200 dark:bg-dark-200 rounded">
              <h3 className="font-medium text-black dark:text-white mb-2">
                Firefox:
              </h3>
              <ol className="list-decimal list-inside text-black/70 dark:text-white/70 space-y-1">
                <li>Go to Settings → Search</li>
                <li>Click "Add" at the bottom</li>
                <li>Enter the same details as above</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="https://github.com/vskrch/Vane"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white transition"
          >
            View source on GitHub <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ExtensionsPage;
