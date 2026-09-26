import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from import_owner_books import preserve_passage_ids, tex_blocks, split_long_tex
from owner_figures import prepare_tex, resolve_image


class OwnerFigureTests(unittest.TestCase):
    def test_chapter_local_and_course_assets_and_missing(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = root / 'chapters/lecture_07/content.tex'
            source.parent.mkdir(parents=True)
            source.write_text('')
            (root / 'assets').mkdir()
            (source.parent / 'local.png').touch()
            (root / 'assets/frame.png').touch()
            self.assertEqual(resolve_image('local.png', source, root / 'figures'), source.parent / 'local.png')
            self.assertEqual(resolve_image('frame.png', source, root / 'figures'), root / 'assets/frame.png')
            with self.assertRaises(FileNotFoundError):
                resolve_image('missing.png', source, root / 'figures')

    def test_tikz_keeps_position_and_caption_through_pandoc(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            image = root / 'diagram.png'
            image.touch()
            source = root / 'content.tex'
            source.write_text(r'''Before.
\begin{figure}\centering
\resizebox{\linewidth}{!}{%
\begin{tikzpicture}\draw (0,0)--(1,1);\end{tikzpicture}}
\caption{Energy $E=mc^2$ diagram.}\end{figure}
After.''')
            with patch('owner_figures.render_tikz', return_value=image):
                blocks, assets = tex_blocks(source)
            self.assertEqual([b['kind'] for b in blocks], ['text', 'figure', 'text'])
            self.assertEqual(blocks[1]['figure']['caption']['en'], 'Energy $E=mc^2$ diagram.')
            self.assertEqual(blocks[1]['u'][0]['en'], [''])
            self.assertEqual(assets['assets/diagram.webp'], image)

    def test_inserted_figures_preserve_existing_and_duplicate_passage_ids(self):
        old = [{'id': 'b0001', 'src': 'Same'}, {'id': 'b0002', 'src': 'Same'}, {'id': 'b0003', 'src': 'End'}]
        new = [{'id': 'b0001', 'src': 'Image', 'figure': {'path': 'assets/a.webp'}},
               {'id': 'b0002', 'src': 'Same'}, {'id': 'b0003', 'src': 'Same'}, {'id': 'b0004', 'src': 'End'}]
        preserve_passage_ids(new, old)
        self.assertEqual([b['id'] for b in new[1:]], ['b0001', 'b0002', 'b0003'])
        self.assertTrue(new[0]['id'].startswith('fig-'))
        repeated = json.loads(json.dumps(new))
        preserve_passage_ids(repeated, new)
        self.assertEqual(repeated, new)

    def test_explicit_multilingual_source_id_survives_adding_image(self):
        old = [{'id': 'ch01-b0033', 'src': 'Caption'}]
        new = [{'id': 'ch01-b0033', 'src': 'Caption', 'figure': {'path': 'assets/a.webp'}}]
        preserve_passage_ids(new, old)
        self.assertEqual(new[0]['id'], old[0]['id'])

    def test_versioned_image_keeps_its_passage_id(self):
        old = [{'id': 'b0003', 'src': 'Caption', 'figure': {'path': 'assets/frame.webp'}}]
        new = [{'id': 'b0004', 'src': 'Caption', 'figure': {'path': 'assets/frame-aabbccddeeff.webp'}}]
        preserve_passage_ids(new, old)
        self.assertEqual(new[0]['id'], old[0]['id'])

    def test_editorial_comments_do_not_cut_off_body_or_create_chapters(self):
        with tempfile.TemporaryDirectory() as temp:
            source = Path(temp) / 'book.tex'
            source.write_text(r'''\chapter{First}
Before.
% Place this before \end{document}; do not create \chapter{Fake}.
After.
\chapter{Second}
Last.
\end{document}''')
            chapters = split_long_tex(source)
            self.assertEqual(len(chapters), 2)
            self.assertIn('After.', ' '.join(b['src'] for b in chapters[0][1]))


if __name__ == '__main__':
    unittest.main()
