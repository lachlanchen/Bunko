import unittest
import xml.etree.ElementTree as ET

from import_scripture import exact_ruby, parse_usfx_book, plain


class ScriptureImportTests(unittest.TestCase):
    def test_translation_markers_and_punctuation_are_preserved(self):
        tokens = [{'t': '慈悲', 'r': 'じひ'}, {'t': '深い。'}]
        text = '慈悲*[1]深い。'
        line = exact_ruby(text, tokens)
        self.assertEqual(plain(line), text)
        self.assertEqual(line[0], ['慈悲', 'じひ'])

    def test_changed_text_does_not_inherit_wrong_reading(self):
        line = exact_ruby('海。', [{'t': '山', 'r': 'やま'}, {'t': '。'}])
        self.assertEqual(line, ['海。'])

    def test_notes_headings_and_poetry_do_not_pollute_verse_text(self):
        book = ET.fromstring('''<book id="PSA"><h>Psalms</h><c id="1"/>
          <d>A Psalm.</d><q><v id="1"/><w>First</w> word<f><fr>1:1 </fr><ft>A note.</ft></f>,
          then <wj>more</wj>.<ve/></q><q><v id="2"/>Second<q>line.</q><ve/></q>
          <c id="2"/><p><v id="1"/>Next chapter.<ve/></p></book>''')
        result = parse_usfx_book(book)
        self.assertEqual(result[1][0], {'heading': 'A Psalm.'})
        self.assertEqual(result[1][1], {'verse': '1', 'text': 'First word, then more.', 'notes': ['1:1 A note.']})
        self.assertEqual(result[1][2]['text'], 'Second line.')
        self.assertEqual(result[2][0]['text'], 'Next chapter.')

    def test_note_only_verse_preserves_publisher_explanation(self):
        book = ET.fromstring('<book id="LUK"><c id="17"/><v id="36"/><f><ft>Some manuscripts add this verse.</ft></f><ve/></book>')
        self.assertEqual(parse_usfx_book(book)[17][0], {'verse': '36', 'text': '', 'notes': ['Some manuscripts add this verse.']})

    def test_heading_notes_remain_separate(self):
        book = ET.fromstring('<book id="PSA"><c id="46"/><d>According to Alamoth.<f><ft>A musical term.</ft></f></d><v id="1"/>God is our refuge.<ve/></book>')
        self.assertEqual(parse_usfx_book(book)[46][0], {'heading': 'According to Alamoth.', 'notes': ['A musical term.']})

    def test_empty_verse_blocks_publication(self):
        with self.assertRaisesRegex(ValueError, 'Empty verse'):
            parse_usfx_book(ET.fromstring('<book id="GEN"><c id="1"/><v id="1"/><ve/></book>'))

    def test_duplicate_chapter_blocks_publication(self):
        with self.assertRaisesRegex(ValueError, 'Duplicate chapter'):
            parse_usfx_book(ET.fromstring('<book id="GEN"><c id="1"/><c id="1"/></book>'))


if __name__ == '__main__':
    unittest.main()
