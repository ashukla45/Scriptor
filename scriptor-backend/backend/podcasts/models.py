from elasticsearch_dsl import Document, Text, Date, Integer, Keyword
from nltk.tokenize import sent_tokenize

class Podcast(Document):
    """
    This defines a Podcast model
    """

    # Podcast metadata
    title = Text()
    lecture_num = Integer()
    date = Date()
    ucsd_podcast_video_url = Text()
    ucsd_podcast_audio_url = Text()
    full_transcript = Text()

    # Some course metadata
    department = Text()
    course_num = Keyword()
    quarter = Text()
    professor = Text()
    section_id = Text()

    # Some of the same fields as above, but indexed for searching through them
    # These will not be set directly, and will only be used when searching through the filters themselves
    exact_value_department = Keyword()
    exact_value_quarter = Keyword()
    exact_value_professor = Keyword()

    # Elasticsearch index settings
    class Index:
        name = "podcasts"

    def get_transcript_sections(self, sentence_split=5):
        transcript_sentences = sent_tokenize(self.full_transcript)

        sections = []
        current_section_sents = []
        for idx, sent in enumerate(transcript_sentences):
            if (idx % sentence_split == 0):

                # Add the section built-up so far to the list of sections
                if current_section_sents:
                    sections.append(" ".join(current_section_sents))

                # Restart a new section
                current_section_sents = [sent, ]
            else:
                current_section_sents.append(sent)

        if current_section_sents:
            sections.append(" ".join(current_section_sents))

        return sections

    def save(self, **kwargs):
        self.exact_value_department = self.department
        self.exact_value_quarter = self.quarter
        self.exact_value_professor = self.professor
        return super().save(**kwargs)

    def convert_to_dict(self):
        dict_ = self.to_dict(include_meta=False)
        dict_['id'] = self.meta.id
        return dict_
