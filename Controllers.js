const Snippet = require('../models/Snippet');
const SnippetVersion = require('../models/SnippetVersion');

exports.createOrUpdateSnippet = async (req, res) => {
  const { user_str_id } = req.params;
  const { snippet_name, language, code_content } = req.body;

  try {
    let snippet = await Snippet.findOne({ user_str_id, snippet_name });

    if (!snippet) {
      snippet = new Snippet({ user_str_id, snippet_name, language });
    } else {
      snippet.language = language;
      snippet.updated_at = new Date();
    }

    const version = new SnippetVersion({
      snippet_id: snippet._id,
      code_content
    });

    await version.save();
    snippet.latest_version_id = version._id;
    await snippet.save();

    return res.status(200).json({
      snippet_name: snippet.snippet_name,
      language: snippet.language,
      updated_at: snippet.updated_at,
      code_content: version.code_content
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};


exports.getSnippet = async (req, res) => {
  const { user_str_id, snippet_name } = req.params;
  const { version_id } = req.query;

  try {
    const snippet = await Snippet.findOne({ user_str_id, snippet_name });
    if (!snippet) return res.status(404).json({ message: 'Snippet not found' });

    let version;
    if (version_id) {
      version = await SnippetVersion.findById(version_id);
    } else {
      version = await SnippetVersion.findById(snippet.latest_version_id);
    }

    if (!version) return res.status(404).json({ message: 'Version not found' });

    return res.status(200).json({
      snippet_name,
      language: snippet.language,
      code_content: version.code_content,
      created_at: snippet.created_at,
      updated_at: snippet.updated_at
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};


exports.getAllSnippets = async (req, res) => {
  const { user_str_id } = req.params;

  try {
    const snippets = await Snippet.find({ user_str_id });

    const response = snippets.map(snippet => ({
      snippet_name: snippet.snippet_name,
      language: snippet.language,
      updated_at: snippet.updated_at
    }));

    return res.status(200).json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};


exports.deleteSnippet = async (req, res) => {
  const { user_str_id, snippet_name } = req.params;

  try {
    const snippet = await Snippet.findOneAndDelete({ user_str_id, snippet_name });

    if (!snippet) return res.status(404).json({ message: 'Snippet not found' });

    await SnippetVersion.deleteMany({ snippet_id: snippet._id });

    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};


exports.getSnippetVersions = async (req, res) => {
  const { user_str_id, snippet_name } = req.params;

  try {
    const snippet = await Snippet.findOne({ user_str_id, snippet_name });
    if (!snippet) return res.status(404).json({ message: 'Snippet not found' });

    const versions = await SnippetVersion.find({ snippet_id: snippet._id }).sort({ created_at: -1 });

    return res.status(200).json(
      versions.map(v => ({
        version_id: v._id,
        code_content: v.code_content,
        created_at: v.created_at
      }))
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};


exports.searchSnippetsByKeyword = async (req, res) => {
  const { user_str_id } = req.params;
  const { keyword } = req.query;

  if (!keyword || keyword.trim() === '') {
    return res.status(400).json({ message: 'Keyword is required' });
  }

  try {
    const snippets = await Snippet.find({ user_str_id }).populate('latest_version_id');

    const matching = snippets.filter(snippet => {
      const content = snippet.latest_version_id?.code_content || '';
      return content.toLowerCase().includes(keyword.toLowerCase());
    });

    const result = matching.map(snippet => ({
      snippet_name: snippet.snippet_name,
      language: snippet.language,
      updated_at: snippet.updated_at
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
