import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from import_owner_books import tex_blocks, preserve_passage_ids
from import_polished_physics import align, reconcile_source_groups


class PolishedPhysicsTests(unittest.TestCase):
    def test_overview_qa_notes_table_link_preserved(self):
        with TemporaryDirectory() as tmp:
            source = Path(tmp) / 'chapter.tex'
            source.write_text(r'''\chapter{Title}
\lectureoverview{Intro $a=b$.}
\begin{classroomqa}\audiencequestion{Why?}\lecturerresponse{Because.}\end{classroomqa}
Body\footnote{Qualification.} \href{https://example.com}{Readable link}
\begin{table}\resizebox{\linewidth}{!}{\begin{tabular}{ll}Name & Field\\Photon & $A$\\\end{tabular}}\caption{Particles}\end{table}''')
            blocks, _ = tex_blocks(source, strict=True)
            text = '\n'.join(b['src'] for b in blocks)
            for expected in ['Intro', 'Why?', 'Because.', 'Qualification.', 'Readable link', 'Particles', 'Photon', 'Name']:
                self.assertIn(expected, text)
            self.assertIn(r'\begin{array}{ll}', text)

    def test_mismatched_translation_fails_before_publication(self):
        block = {'id': 'b0001', 'kind': 'text', 'src': 'English', 'u': [{'en': ['English'], 'src': 'English'}]}
        merged = align({'en': [block], 'ja': [block], 'zh': [block]})
        self.assertEqual(merged[0]['u'][0]['ja'], ['English'])
        with self.assertRaises(ValueError):
            align({'en': [block], 'ja': [], 'zh': [block]})

    def test_adding_overview_keeps_previous_anchor(self):
        old = [{'id': 'b0001', 'src': 'body', 'kind': 'text', 'u': [{'en': ['body']}]}]
        new = [{'id': 'b0001', 'src': 'intro', 'kind': 'text', 'u': [{'en': ['intro']}]},
               {'id': 'b0002', 'src': 'body', 'kind': 'text', 'u': [{'en': ['body']}]}]
        preserve_passage_ids(new, old)
        self.assertEqual(new[1]['id'], 'b0001')
        self.assertNotEqual(new[0]['id'], 'b0001')

    def test_leading_commutator_survives_pandoc(self):
        with TemporaryDirectory() as tmp:
            source = Path(tmp) / 'chapter.tex'
            source.write_text(r'\begin{equation}[V,U(t)] = 0\end{equation}')
            blocks, _ = tex_blocks(source, strict=True)
            math = [p['math'] for b in blocks for u in b['u']
                    for p in u.get('rich', {}).get('en', []) if 'math' in p]
            self.assertEqual(math, ['[V,U(t)] = 0'])

    def test_caption_marker_precedes_figure_and_keeps_rich_math(self):
        with TemporaryDirectory() as tmp:
            source = Path(tmp) / 'chapter.tex'
            (Path(tmp) / 'figure.png').touch()
            source.write_text(r'''\begin{figure}
BUNKOUNIT000010TOKEN
\includegraphics{figure.png}
\caption{The field $A$.}\end{figure}''')
            blocks, _ = tex_blocks(source, strict=True)
            figure = next(b for b in blocks if 'figure' in b)
            self.assertEqual(figure['_sourceSegment'], 'BUNKOUNIT000010TOKEN')
            self.assertEqual(figure['figure']['caption']['en'], '')
            self.assertIn({'math': 'A', 'display': False}, figure['u'][0]['rich']['en'])

    def test_reconcile_only_within_exact_source_segment(self):
        def block(text, segment):
            return {'id': text, 'src': text, 'kind': 'text', '_sourceSegment': segment,
                    'u': [{'src': text, 'en': [text]}]}
        layers = {'en': [block('one two', 'source1')],
                  'ja': [block('one', 'source1'), block('two', 'source1')],
                  'zh': [block('one two', 'source1')]}
        result = reconcile_source_groups(layers)
        self.assertEqual(result['ja'][0]['src'], 'one two')
        with self.assertRaises(ValueError):
            reconcile_source_groups({'en': [block('one', 'source1')],
                                     'ja': [block('one', 'source2')],
                                     'zh': [block('one', 'source1')]})


if __name__ == '__main__':
    unittest.main()
