"""Optional pronunciation aids, preserving the publisher's text byte for byte.

Use fugashi with an existing UniDic dictionary. Unknown kanji block publication
until a reading is reviewed; never guess an isolated kanji's on-reading.
"""
from collections import Counter
from pathlib import Path
import re

HAN = re.compile(r'[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff々]')
KANA = re.compile(r'[ぁ-ゖー]+')
RUN = re.compile(r'[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff々]+')
INLINE_READING = re.compile(r'[\u3400-\u4dbf\u4e00-\u9fff々]+（[ぁ-ゖー]+）')


def hiragana(value):
    return ''.join(chr(ord(c) - 0x60) if 'ァ' <= c <= 'ヶ' else c for c in value)


def ruby_word(surface, reading):
    """Keep lexical compounds together; exclude matching surrounding okurigana."""
    first = next(i for i, c in enumerate(surface) if HAN.fullmatch(c))
    last = max(i for i, c in enumerate(surface) if HAN.fullmatch(c)) + 1
    prefix, base, suffix = surface[:first], surface[first:last], surface[last:]
    if (prefix and not reading.startswith(hiragana(prefix))) or (suffix and not reading.endswith(hiragana(suffix))):
        return [[surface, reading]]
    trimmed = reading[len(prefix):len(reading) - len(suffix) if suffix else None]
    return ([prefix] if prefix else []) + [[base, trimmed]] + ([suffix] if suffix else [])


# Whole lexical tokens only: 主人 and 名前 keep their own dictionary readings.
SCRIPTURE_READINGS = {'主': 'しゅ', '御名': 'みな', '開端': 'かいたん', '送': 'おく', '餐': 'さん', '棄': 'す', '招': 'まね', '携': 'たずさ'}
PHRASE_READINGS = {
    '叔（伯）母': 'おば', '叔（伯）父': 'おじ',
    '川々': 'かわがわ', '丘々': 'おかおか', '谷々': 'たにだに',
    '門々': 'かどかど', '岩々': 'いわいわ', '雲々': 'くもぐも',
    '海々': 'うみうみ', '宮々': 'みやみや',
}


class JapaneseReadings:
    def __init__(self, dictionary):
        from fugashi import GenericTagger
        directory = Path(dictionary).resolve()
        if not (directory / 'sys.dic').is_file():
            raise ValueError('An existing UniDic dictionary is required')
        self.tagger = GenericTagger(f'-r /dev/null -d "{directory}"')
        self.unknown = Counter()

    def _run(self, text):
        result, cursor = [], 0
        for word in self.tagger(text):
            surface = word.surface
            offset = text.find(surface, cursor)
            if offset < 0:
                raise ValueError('Tokenizer changed the source text')
            if offset > cursor:
                result.append(text[cursor:offset])
            if HAN.search(surface):
                # UniDic kana surface field, not lemma or pronunciation: 食べた
                # must stay たべた; standard kana spellings retain こう/けい.
                reading = SCRIPTURE_READINGS.get(surface) or hiragana(word.feature[17] if len(word.feature) > 17 else '')
                if not KANA.fullmatch(reading):
                    self.unknown[surface] += 1
                    result.append(surface)
                else:
                    result.extend(ruby_word(surface, reading))
            else:
                result.append(surface)
            cursor = offset + len(surface)
        if cursor < len(text):
            result.append(text[cursor:])
        if ''.join(t if isinstance(t, str) else t[0] for t in result) != text:
            raise ValueError('Ruby changed the publisher text')
        return result

    def line(self, text):
        # Keep existing inline pronunciation intact instead of showing it twice.
        # Limit dictionary input to Japanese runs: UniDic otherwise sometimes
        # treats 々[1] as a single unknown symbol and loses 人々's reading.
        protected = re.compile('|'.join(map(re.escape, PHRASE_READINGS)) + '|' + INLINE_READING.pattern)
        result, cursor = [], 0

        def segment(value):
            pieces, position = [], 0
            for match in RUN.finditer(value):
                if match.start() > position: pieces.append(value[position:match.start()])
                pieces.extend(self._run(match.group(0)))
                position = match.end()
            if position < len(value): pieces.append(value[position:])
            return pieces

        for match in protected.finditer(text):
            result.extend(segment(text[cursor:match.start()]))
            value = match.group(0)
            result.append([value, PHRASE_READINGS[value]] if value in PHRASE_READINGS else value)
            cursor = match.end()
        result.extend(segment(text[cursor:]))
        if ''.join(t if isinstance(t, str) else t[0] for t in result) != text:
            raise ValueError('Ruby changed the publisher text')
        return result

    def annotate(self, title, content):
        if 'ja' in title:
            title['ja'] = self.line(''.join(t if isinstance(t, str) else t[0] for t in title['ja']))
        for chapter in content:
            if 'ja' in chapter['title']:
                chapter['title']['ja'] = self.line(''.join(t if isinstance(t, str) else t[0] for t in chapter['title']['ja']))
            for paragraph in chapter['p']:
                for unit in paragraph['u']:
                    if 'ja' in unit:
                        unit['ja'] = self.line(''.join(t if isinstance(t, str) else t[0] for t in unit['ja']))
        if self.unknown:
            raise ValueError(f'Review unknown Japanese readings: {dict(self.unknown)}')
