import pool from '../config/db';
import { ResultSetHeader } from 'mysql2';
export const mockAnalyzeDocument = async (documentId: number, documentText: string) => {
  const mockConcepts = [
    { name: 'Cơ bản về ' + documentText.substring(0, 10), level: 'basic', summary: 'Định nghĩa cơ bản về chủ đề.' },
    { name: 'Cấu trúc mảng', level: 'basic', summary: 'Mảng lưu trữ liên tiếp.' },
    { name: 'Danh sách liên kết', level: 'intermediate', summary: 'Lưu trữ rời rạc bằng node.' },
    { name: 'Cây nhị phân', level: 'advanced', summary: 'Cấu trúc cây có tối đa 2 con.' }
  ];

  const conceptIds: number[] = [];
  for (const concept of mockConcepts) {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO concepts (document_id, name, level, summary) VALUES (?, ?, ?, ?)',
      [documentId, concept.name, concept.level, concept.summary]
    );
    conceptIds.push(result.insertId);
  }
  if (conceptIds.length >= 4) {
    await pool.query(
      'INSERT INTO concept_relationships (source_concept_id, target_concept_id, label) VALUES (?, ?, ?), (?, ?, ?)',
      [conceptIds[0], conceptIds[1], 'liên quan', conceptIds[1], conceptIds[2], 'cần hiểu trước']
    );
  }
  const mockQuiz = [
    {
      question: 'Phát biểu nào đúng về Mảng?',
      options: JSON.stringify(['Lưu trữ liên tiếp', 'Lưu trữ rời rạc', 'Kích thước linh hoạt', 'Truy cập O(n)']),
      correct_answer: 0,
      explanation: 'Mảng là cấu trúc dữ liệu lưu trữ các phần tử ở các vị trí bộ nhớ liên tiếp nhau.'
    },
    {
      question: 'Trong cây nhị phân, một node có tối đa bao nhiêu con?',
      options: JSON.stringify(['1', '2', '3', 'Không giới hạn']),
      correct_answer: 1,
      explanation: 'Cây nhị phân (Binary Tree) quy định mỗi node chỉ có tối đa 2 node con (trái và phải).'
    }
  ];

  for (const quiz of mockQuiz) {
    await pool.query(
      'INSERT INTO quiz_questions (document_id, question, options, correct_answer, explanation) VALUES (?, ?, ?, ?, ?)',
      [documentId, quiz.question, quiz.options, quiz.correct_answer, quiz.explanation]
    );
  }
  await pool.query('UPDATE documents SET status = ? WHERE id = ?', ['analyzed', documentId]);
};
