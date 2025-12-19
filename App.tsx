
import React, { useState, useCallback, FormEvent } from 'react';
import { analyzeSupplements } from './services/geminiService';

const Pill: React.FC<{ text: string; onRemove: () => void }> = ({ text, onRemove }) => (
  <span className="inline-flex items-center justify-center px-4 py-1.5 text-sm font-semibold leading-none text-blue-700 bg-blue-50 border border-blue-200 rounded-full shadow-sm transition-all hover:bg-blue-100">
    {text}
    <button onClick={onRemove} className="ml-2 text-blue-400 hover:text-blue-600 focus:outline-none transition-colors" aria-label={`Remove ${text}`}>
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </button>
  </span>
);

const Spinner: React.FC = () => (
    <div className="flex flex-col justify-center items-center p-12 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent border-solid rounded-full animate-spin"></div>
        <p className="text-blue-600 font-medium animate-pulse">AI 전문가가 복용 목록을 정밀 분석 중입니다...</p>
    </div>
);

const Alert: React.FC<{ message: string }> = ({ message }) => (
  <div className="p-4 mt-6 text-red-800 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3" role="alert">
    <svg className="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
    <p><span className="font-bold">분석 중단:</span> {message}</p>
  </div>
);

const App: React.FC = () => {
    const [supplements, setSupplements] = useState<string[]>(['와파린', '오메가-3 (2000mg)', '비타민 D']);
    const [newItem, setNewItem] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<string>('');

    const handleAddItem = (e: FormEvent) => {
        e.preventDefault();
        const trimmed = newItem.trim();
        if (trimmed && !supplements.includes(trimmed)) {
            setSupplements([...supplements, trimmed]);
            setNewItem('');
        }
    };

    const handleRemoveItem = (indexToRemove: number) => {
        setSupplements(supplements.filter((_, index) => index !== indexToRemove));
    };

    const handleAnalyze = useCallback(async () => {
        if (supplements.length === 0) {
            setError('최소 한 개 이상의 의약품이나 영양제를 입력해주세요.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult('');

        try {
            const analysis = await analyzeSupplements(supplements);
            setResult(analysis);
        } catch (e: any) {
            setError(e.message || '분석 중 예상치 못한 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, [supplements]);

    const renderResult = (text: string) => {
        const sections = text.split(/(###\s.*)/).filter(Boolean);

        return sections.map((section, index) => {
            if (section.startsWith('### ')) {
                return (
                    <h3 key={index} className="text-xl font-bold mt-8 mb-3 text-gray-900 border-b pb-2 flex items-center">
                        <span className="w-1.5 h-6 bg-blue-500 rounded-full mr-3"></span>
                        {section.replace('###', '').trim()}
                    </h3>
                );
            }

            const lines = section.trim().split('\n').filter(line => line.trim() !== '');
            const elements: React.ReactElement[] = [];
            let listItems: React.ReactElement[] = [];

            const flushList = () => {
                if (listItems.length > 0) {
                    elements.push(<ul key={`ul-${elements.length}`} className="list-disc pl-6 space-y-2 mt-3 text-gray-700">{listItems}</ul>);
                    listItems = [];
                }
            };

            lines.forEach((line, lineIndex) => {
                // Basic markdown bold to HTML
                const processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 font-bold">$1</strong>');

                if (line.trim().startsWith('- ')) {
                    listItems.push(
                        <li key={lineIndex} 
                            className="leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: processedLine.replace(/^- /, '') }} 
                        />
                    );
                } else {
                    flushList();
                    elements.push(
                        <p key={lineIndex} 
                           className="mt-3 leading-relaxed text-gray-700" 
                           dangerouslySetInnerHTML={{ __html: processedLine }} 
                        />
                    );
                }
            });

            flushList();
            return <div key={index}>{elements}</div>;
        });
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-12 px-4">
            <div className="w-full max-w-2xl mx-auto">
                <header className="text-center mb-12">
                    <div className="inline-block p-2 px-4 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                        Smart Health Assistant
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                        영양제 <span className="text-blue-600">상호작용</span> 체커
                    </h1>
                    <p className="mt-4 text-gray-500 text-lg">
                        복용 중인 약물 조합의 안전성을 AI가 즉시 분석합니다.
                    </p>
                </header>

                <main className="bg-white p-8 rounded-3xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] border border-gray-100 transition-all">
                    <div className="mb-8">
                        <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">복용 중인 항목 추가</label>
                        <form onSubmit={handleAddItem} className="flex gap-2">
                            <input
                                type="text"
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                placeholder="예: 아스피린, 비타민 C, 루테인..."
                                className="flex-grow px-5 py-3.5 text-gray-800 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-gray-400"
                            />
                            <button
                                type="submit"
                                className="px-6 py-3.5 font-bold text-white bg-blue-600 rounded-2xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                            >
                                추가
                            </button>
                        </form>
                    </div>

                    <div className="mb-8 p-6 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 min-h-[120px] flex flex-wrap content-start gap-2">
                        {supplements.length > 0 ? (
                            supplements.map((item, index) => (
                                <Pill key={index} text={item} onRemove={() => handleRemoveItem(index)} />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center w-full h-full text-gray-400 space-y-2">
                                <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm">목록이 비어있습니다. 약품을 추가해주세요.</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading || supplements.length === 0}
                        className="w-full py-4.5 rounded-2xl bg-gray-900 text-white font-bold text-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 shadow-xl"
                    >
                        {isLoading ? '데이터 분석 중...' : (
                            <>
                                <span>🔬 AI 분석 시작하기</span>
                            </>
                        )}
                    </button>

                    {error && <Alert message={error} />}
                    
                    {(isLoading || result) && (
                        <div id="result-section" className="mt-12 pt-8 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black text-gray-900">전문 분석 리포트</h2>
                                <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-md">AI Generated</span>
                            </div>
                            {isLoading ? (
                                <Spinner />
                            ) : (
                                <div className="p-7 bg-[#F1F5F9] rounded-3xl border border-gray-200 text-gray-800 leading-relaxed shadow-inner">
                                    {renderResult(result)}
                                </div>
                            )}
                        </div>
                    )}
                </main>
                
                <footer className="mt-12 text-center text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                    <p className="mb-2">⚠️ 주의: 본 정보는 의학적 조언이 아닙니다.</p>
                    <p>복용 중인 약물의 변경이나 중단은 반드시 담당 전문의 또는 약사와 상의 후 결정하시기 바랍니다.</p>
                </footer>
            </div>
        </div>
    );
};

export default App;
