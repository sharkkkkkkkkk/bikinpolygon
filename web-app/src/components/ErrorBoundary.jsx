import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 p-6 text-center rounded-2xl border-2 border-slate-300">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-3 animate-bounce" />
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-1">
            Terjadi Kesalahan Ringan Pada Tampilan Peta
          </h3>
          <p className="text-xs text-slate-500 max-w-md mb-4">
            {this.state.error?.message || "Terjadi kesalahan memuat komponen. Klik tombol di bawah untuk memuat ulang peta."}
          </p>
          <Button 
            onClick={this.handleReset}
            className="bg-[#1D4ED8] hover:bg-blue-700 text-white font-bold rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Muat Ulang Peta
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
