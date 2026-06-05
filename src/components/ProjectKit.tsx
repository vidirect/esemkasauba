import { motion } from 'motion/react';
import { X, FileText, CheckSquare, Lightbulb, Link as LinkIcon, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ProjectKit as KitType } from '../types';

interface ProjectKitProps {
  onClose: () => void;
  kit: KitType;
}

export default function ProjectKit({ onClose, kit }: ProjectKitProps) {
  const kitContent = `
# ${kit.title}

## 1. Workflow
${kit.workflow.map(step => `- ${step}`).join('\n')}

## 2. Assessment Rubric
${kit.rubric.map(item => `- ${item}`).join('\n')}

## 3. Examples
${kit.examples.map(ex => `- ${ex}`).join('\n')}

## 4. References
${kit.references.map(ref => `- ${ref}`).join('\n')}
`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-3xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <BookOpen size={24} />
            <h3 className="text-2xl font-bold">Project Kit</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 prose prose-indigo max-w-none">
          <div className="markdown-body">
            <ReactMarkdown>{kitContent}</ReactMarkdown>
          </div>
        </div>

        <div className="p-8 border-t border-gray-100 bg-gray-50 flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          <button className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
            Download Kit
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
