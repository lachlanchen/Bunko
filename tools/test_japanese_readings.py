import os
import unittest

from japanese_readings import JapaneseReadings, ruby_word
from import_scripture import plain


class JapaneseReadingTests(unittest.TestCase):
    def test_compounds_and_okurigana_stay_aligned(self):
        self.assertEqual(ruby_word('慈悲深い', 'じひぶかい'), [['慈悲深', 'じひぶか'], 'い'])
        self.assertEqual(ruby_word('お方', 'おかた'), ['お', ['方', 'かた']])
        self.assertEqual(ruby_word('乞い願う', 'こいねがう'), [['乞い願', 'こいねが'], 'う'])

    @unittest.skipUnless(os.environ.get('BUNKO_UNIDIC'), 'Set BUNKO_UNIDIC for the real dictionary test')
    def test_context_and_source_punctuation_with_real_dictionary(self):
        readings = JapaneseReadings(os.environ['BUNKO_UNIDIC'])
        source = '主*の御名。慈悲深いお方に乞い願う。人々[1]。蔑（さげす）む。'
        line = readings.line(source)
        self.assertEqual(plain(line), source)
        for token in [['主', 'しゅ'], ['御名', 'みな'], ['方', 'かた'], ['人々', 'ひとびと']]:
            self.assertIn(token, line)
        self.assertIn('蔑（さげす）', line)
        self.assertFalse(readings.unknown)
        # Latin extended characters and literal markup are never duplicated.
        self.assertEqual(plain(readings.line('Gyūichi <i>日本</i> Tçuzzu')), 'Gyūichi <i>日本</i> Tçuzzu')

    @unittest.skipUnless(os.environ.get('BUNKO_UNIDIC'), 'Set BUNKO_UNIDIC for the real dictionary test')
    def test_unknown_kanji_blocks_publishing(self):
        readings = JapaneseReadings(os.environ['BUNKO_UNIDIC'])
        with self.assertRaisesRegex(ValueError, 'Review unknown'):
            readings.annotate({'ja': ['龘']}, [])


if __name__ == '__main__':
    unittest.main()
