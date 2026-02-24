export const PieChart = ({ data }: { data: { label: string, value: number, color: string }[] }) => {
    const total = data.reduce((acc, d) => acc + d.value, 0);
    let cumulativePercent = 0;

    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    if (total === 0) return null;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                    {data.map((d, i) => {
                        const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                        cumulativePercent += d.value / total;
                        const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                        const largeArcFlag = d.value / total > 0.5 ? 1 : 0;
                        const pathData = [`M ${startX} ${startY}`, `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, `L 0 0`].join(' ');
                        return <path key={i} d={pathData} fill={d.color} stroke="#fff" strokeWidth="0.01" />;
                    })}
                </svg>
            </div>
            <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                  gap: '0.4rem 0.8rem', 
                  flex: 1,
                  width: '100%' 
              }}>
                {data.map((d, i) => (
                    <div key={i} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.4rem', 
                          fontSize: '0.7rem', 
                          padding: '2px 0',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                      }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.color }} />
                        <span style={{ fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}:</span>
                        <span style={{ color: '#64748b', fontSize: '0.65rem' }}>{((d.value / total) * 100).toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};