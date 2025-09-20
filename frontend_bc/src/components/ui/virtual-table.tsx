import  {useState, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualTableProps {
  data: any[];
  columns: {
    key: string;
    label: string;
    type?: 'qty' | 'montant';
  }[];
  height?: number;
  rowHeight?: number;
  onRowClick?: (row: any) => void;
}

export function VirtualTable({ 
  data, 
  columns, 
  height = 400, 
  rowHeight = 50,
  onRowClick 
}: VirtualTableProps) {
  const [parentRef, setParentRef] = useState<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  const getNested = useCallback((obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : ''), obj);
  }, []);

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div ref={setParentRef} style={{ height, overflow: 'auto' }}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(col => (
              <TableHead key={col.key} className={`font-semibold uppercase tracking-wider relative group ${col.type === 'qty' ? 'bg-blue-50 dark:bg-blue-900/30' : ''} ${col.type === 'montant' ? 'bg-green-50 dark:bg-green-900/30' : ''}`}>
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {virtualRows.map(virtualRow => {
            const row = data[virtualRow.index];
            return (
              <TableRow 
                key={virtualRow.index}
                style={{
                  height: `${rowHeight}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                onClick={() => onRowClick?.(row)}
                className="cursor-pointer hover:bg-muted/50"
              >
                {columns.map(col => (
                  <TableCell key={col.key} className={`py-2 px-4 font-medium whitespace-nowrap ${col.type === 'qty' ? 'bg-blue-50 dark:bg-blue-900/30' : ''} ${col.type === 'montant' ? 'bg-green-50 dark:bg-green-900/30' : ''}`}>
                    {(() => {
                      if (col.key === 'Reliquat') {
                        const qteBc = Number(getNested(row, 'prestation.qteBc'));
                        const qteEncours = Number(getNested(row, 'qteEncours'));
                        const qteRealise = Number(getNested(row, 'qteRealise'));
                        if (isNaN(qteBc) || isNaN(qteEncours) || isNaN(qteRealise)) return '-';
                        return (qteBc - qteEncours - qteRealise).toFixed(2);
                      }
                      const value = getNested(row, col.key);
                      if (value === null || value === undefined || value === '') return '-';
                      return String(value);
                    })()}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
} 