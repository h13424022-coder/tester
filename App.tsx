
import React, { useState, useCallback, FormEvent } from 'react';
import { analyzeSupplements } from './services/geminiService';

const Pill: React.FC<{ text: string; onRemove: () => void }> = ({ text, onRemove }) => (
  <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-medium leading-none text-blue-800 bg-blue-100 rounded-full">
    {text}
    <button onClick={onRemove} className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none">
      &#x2715;
    </button>
  </span>
);

const Spinner: React.FC = () => (
    <div className="flex justify-center items-center p-8">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent border-solid rounded-full animate-spin"></div>
    </div>
);

const Alert: React.FC<{ message: string }> = ({ message }) => (
  <div className="p-4 mt-4 text-red-800 bg-red-100 border border-red-200 rounded-lg">
    <p><span className="font-bold">오류:</span> {message}</p>
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
        if (newItem.trim() && !supplements.includes(newItem.trim())) {
            setSupplements([...supplements, newItem.trim()]);
            setNewItem('');
        }
    };

    const handleRemoveItem = (indexToRemove: number) => {
        setSupplements(supplements.filter((_, index) => index !== indexToRemove));
    };

    const handleAnalyze = useCallback(async () => {
        if (supplements.length === 0) {
            setError('분석할 항목을 하나 이상 추가해주세요.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult('');

        try {
            const analysis = await analyzeSupplements(supplements);
            setResult(analysis);
        } catch (e) {
            setError('AI 분석 중 오류가 발생했습니다. API 키를 확인하거나 잠시 후 다시 시도해주세요.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [supplements]);

    const renderResult = (text: string) => {
        const sections = text.split(/(###\s.*\n)/).filter(Boolean);
        return sections.map((section, index) => {
            if (section.startsWith('### ')) {
                 return <h3 key={index} className="text-xl font-bold mt-6 mb-2 text-gray-800">{section.replace('###', '').trim()}</h3>
            }
            return <div key={index} className="prose prose-blue max-w-none" dangerouslySetInnerHTML={{__html: section.replace(/- \*\*(.*)\*\*:/g, '<p class="mt-2"><strong class="text-gray-700">$1</strong>:')
            .replace(/\n/g, '<br />')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            }}/>
        })
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-3xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800">
                        <span className="text-blue-600">AI 영양제</span> 상호작용 분석
                    </h1>
                    <p className="mt-3 text-lg text-gray-600">
                        복용 중인 영양제와 의약품의 잠재적 위험을 확인하세요.
                    </p>
                </header>

                <main className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-700 mb-3">1. 복용 목록 추가</h2>
                        <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                placeholder="의약품 또는 영양제 이름 입력 (예: 마그네슘)"
                                className="flex-grow w-full px-4 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            />
                            <button
                                type="submit"
                                className="w-full sm:w-auto px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105"
                            >
                                추가
                            </button>
                        </form>
                    </div>

                    <div className="mb-6 min-h-[6rem] p-4 bg-gray-50 rounded-lg border">
                        {supplements.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {supplements.map((item, index) => (
                                    <Pill key={index} text={item} onRemove={() => handleRemoveItem(index)} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                               <p className="text-gray-500">분석할 항목을 추가해주세요.</p>
                            </div>
                        )}
                    </div>

                    <div className="text-center mb-6">
                        <button
                            onClick={handleAnalyze}
                            disabled={isLoading || supplements.length === 0}
                            className="w-full sm:w-1/2 px-8 py-4 text-lg font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                        >
                            {isLoading ? '분석 중...' : '🔬 AI 분석 시작하기'}
                        </button>
                    </div>

                    {error && <Alert message={error} />}
                    
                    {(isLoading || result) && (
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">분석 결과</h2>
                            {isLoading ? (
                                <Spinner />
                            ) : (
                                <div className="p-5 bg-blue-50/50 rounded-lg border border-blue-100 space-y-2 text-gray-700 leading-relaxed">
                                    {renderResult(result)}
                                </div>
                            )}
                        </div>
                    )}
                </main>
                 <footer className="text-center mt-8 text-sm text-gray-500">
                    <p>
                        본 분석 결과는 AI를 통해 제공되는 정보이며, 의학적 진단을 대체할 수 없습니다.
                    </p>
                    <p>
                        정확한 정보는 반드시 의사 또는 약사와 상담하세요.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default App;
