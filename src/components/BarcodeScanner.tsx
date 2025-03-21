import React, { useEffect, useState, useRef } from "react";
import { Scan } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

export function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [barcode, setBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastKeystrokeTime = useRef(0);
  const buffer = useRef("");

  useEffect(() => {
    // Setup listener for barcode scanner
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isScanning) return;
      
      // Most barcode scanners work by simulating keyboard entry
      const currentTime = new Date().getTime();
      
      // If there's a significant delay, it's likely manual keyboard input
      if (currentTime - lastKeystrokeTime.current > 50) {
        buffer.current = "";
      }
      
      // Some scanners send enter key to indicate end of scan
      if (event.key === "Enter") {
        if (buffer.current.length > 0) {
          onScan(buffer.current);
          buffer.current = "";
        }
        return;
      }
      
      // Update buffer with scanned character
      buffer.current += event.key;
      lastKeystrokeTime.current = currentTime;
    };

    window.addEventListener("keydown", handleKeyDown);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isScanning, onScan]);

  const toggleScanner = () => {
    if (!isScanning) {
      setIsScanning(true);
      toast.info("Barcode scanner activated. Ready to scan.");
      // Focus the input field
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } else {
      setIsScanning(false);
      toast.info("Barcode scanner deactivated.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode.trim()) {
      onScan(barcode.trim());
      setBarcode("");
      // Keep focus on input for continuous scanning
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2">
        <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder={isScanning ? "Scan barcode..." : "Enter barcode manually..."}
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="flex-1"
            autoFocus={isScanning}
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <Button
          onClick={toggleScanner}
          variant={isScanning ? "destructive" : "outline"}
          size="icon"
          className={isScanning ? "animate-pulse" : ""}
        >
          <Scan size={18} />
        </Button>
      </div>
      <div className="text-xs text-muted-foreground">
        {isScanning ? (
          <span className="text-accent">
            Scanner is active. Scan barcode or click to deactivate.
          </span>
        ) : (
          <span>Click the scan button to activate barcode scanner.</span>
        )}
      </div>
    </div>
  );
}
