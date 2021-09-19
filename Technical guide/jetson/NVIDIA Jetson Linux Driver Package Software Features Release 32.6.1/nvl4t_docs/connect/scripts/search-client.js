// Copyright (c) 2011-2020 Quadralay Corporation.  All rights reserved.
//
// ePublisher 2020.1
//

function GetTermsFromArray(param_set) {
    var result = new Array();
    var entry;

    param_set.forEach(function (element) {
        entry = new Array(element[0], 'w'); // [<word>, <type>]
        result.push(entry);
    });

    return result;
};

var SearchClient = {};

SearchClient.SearchReplace = function (paramString, paramSearchString, paramReplaceString) {
    'use strict';

    var  result, index;

    result = paramString;

    if ((paramSearchString.length > 0) && (result.length > 0)) {
        index = result.indexOf(paramSearchString, 0);
        while (index !== -1) {
            result = result.substring(0, index) + paramReplaceString + result.substring(index + paramSearchString.length, result.length);
            index += paramReplaceString.length;

            index = result.indexOf(paramSearchString, index);
        }
    }

    return result;
};

SearchClient.EscapeRegExg = function (param_string) {
    'use strict';

    var result;

    // Initialize result
    //
    result = param_string;

    // Escape special characters
    // \ . ? + - ^ $ | ( ) [ ] { }
    //
    result = SearchClient.SearchReplace(result, '\\', '\\\\');
    result = SearchClient.SearchReplace(result, '.', '\\.');
    result = SearchClient.SearchReplace(result, '?', '\\?');
    result = SearchClient.SearchReplace(result, '+', '\\+');
    result = SearchClient.SearchReplace(result, '-', '\\-');
    result = SearchClient.SearchReplace(result, '^', '\\^');
    result = SearchClient.SearchReplace(result, '$', '\\$');
    result = SearchClient.SearchReplace(result, '|', '\\|');
    result = SearchClient.SearchReplace(result, '(', '\\(');
    result = SearchClient.SearchReplace(result, ')', '\\)');
    result = SearchClient.SearchReplace(result, '[', '\\[');
    result = SearchClient.SearchReplace(result, ']', '\\]');
    result = SearchClient.SearchReplace(result, '{', '\\{');
    result = SearchClient.SearchReplace(result, '}', '\\}');
    result = SearchClient.SearchReplace(result, '*', '\\*');

    // Windows IE 4.0 is brain dead
    //
    result = SearchClient.SearchReplace(result, '/', '[/]');

    return result;
};

SearchClient.WordToRegExpPattern = function (paramWord) {
    'use strict';

    var result;

    // Escape special characters
    //
    result = SearchClient.EscapeRegExg(paramWord);

    // Add ^ and $ to force whole string match
    //
    result = '^' + result + '$';

    return result;
};

SearchClient.EscapeHTML = function (paramHTML) {
    'use strict';

    var  escapedHTML = paramHTML;

    // Escape problematic characters
    // & < > "
    //
    escapedHTML = SearchClient.SearchReplace(escapedHTML, '&', '&amp;');
    escapedHTML = SearchClient.SearchReplace(escapedHTML, '<', '&lt;');
    escapedHTML = SearchClient.SearchReplace(escapedHTML, '>', '&gt;');
    escapedHTML = SearchClient.SearchReplace(escapedHTML, '"', '&quot;');

    return escapedHTML;
};

SearchClient.ParseWordsAndPhrases = function (paramInput) {
    'use strict';

    var wordSplits, results, stringWithSpace, currentPhrase, currentWord, wordIndex, startQuotes;

    wordSplits = [];
    results = [];
    stringWithSpace = 'x x';
    currentPhrase = '';
    currentWord = '';
    wordIndex = 0;
    startQuotes = false;

    if (paramInput.length > 0) {
        wordSplits = paramInput.split(stringWithSpace.substring(1, 2));
        for (wordIndex = 0; wordIndex < wordSplits.length; wordIndex += 1) {
            currentWord = wordSplits[wordIndex];
            if (currentWord.length > 0) {
                // If the current word does not start with or end with a double quote
                // and a phrase has not been started, then add it to the result word list
                // and continue
                //
                if (currentWord.charAt(0) === '"') {
                    if (startQuotes) {
                        // This entry ends the current phrase and the word following
                        // the quote will be added as a separate word, unless there is
                        // a second quote at the start that will start a new phrase
                        //
                        results[results.length] = [];
                        results[results.length-1].push(currentPhrase.substring(0, currentPhrase.length - 1));
                        results[results.length-1].push('p');

                        currentPhrase = '';

                        while ((currentWord.length > 0) && (currentWord.charAt(0) === '"')) {
                            currentWord = currentWord.substring(1, currentWord.length);
                        }
                        if (currentWord.length > 0) {
                            currentPhrase += currentWord + ' ';
                        }
                    } else {
                        startQuotes = true;

                        // Strip off the leading quotes and process the word
                        //
                        while ((currentWord.length > 0) && (currentWord.charAt(0) === '"')) {
                            currentWord = currentWord.substring(1, currentWord.length);
                        }

                        if (currentWord.length > 0) {
                            // One Word Phrase - Add it as a word and set startQuotes to false
                            //
                            if (currentWord.charAt(currentWord.length - 1) === '"') {
                                startQuotes = false;
                                // Strip off trailing quotes and add it as a word
                                //
                                while ((currentWord.length > 0) && (currentWord.charAt(currentWord.length - 1) === '"')) {
                                    currentWord = currentWord.substring(0, currentWord.length - 1);
                                }

                                // Add the Word to the result array
                                //
                                results[results.length] = [];
                                results[results.length-1].push(currentWord);
                                results[results.length-1].push('p');
                            } else {
                                // The current word starts a phrase
                                //
                                currentPhrase += currentWord + ' ';
                            }
                        }
                    }
                } else if (currentWord.charAt(currentWord.length - 1) === '"') {
                    // Strip off trailing quotes regardless
                    //
                    while ((currentWord.length > 0) && (currentWord.charAt(currentWord.length - 1) === '"')) {
                        currentWord = currentWord.substring(0, currentWord.length - 1);
                    }

                    // Only process the word if the length is greater than 0 after
                    // stripping the trailing quotes
                    //
                    if (currentWord.length > 0) {
                        if (startQuotes) {
                            currentPhrase += currentWord;

                            results[results.length] = [];
                            results[results.length-1].push(currentPhrase);
                            results[results.length-1].push('p');

                            startQuotes = false;
                            currentPhrase = '';
                        } else {
                            // The phrase is not started
                            //
                            results[results.length] = [];
                            results[results.length-1].push(currentWord);
                            if (wordIndex === (wordSplits.length - 1)) {
                                results[results.length-1].push('l');
                            } else {
                                results[results.length-1].push('w');
                            }
                        }
                    }
                } else {
                    // The word is either a single word or in the middle of a phrase
                    //
                    if (startQuotes) {
                        currentPhrase += currentWord + ' ';
                    } else {
                        results[results.length] = [];
                        results[results.length-1].push(currentWord);
                        if (wordIndex === (wordSplits.length - 1)) {
                            results[results.length-1].push('l');
                        } else {
                            results[results.length-1].push('w');
                        }
                    }
                }
            }
        }
    }

    return results;
};

SearchClient.ApplyWordBreaks = function (paramString) {
    'use strict';

    var result, index, insert_break;

    result = '';

    // Apply Unicode rules for word breaking
    // These rules taken from http://www.unicode.org/unicode/reports/tr29/
    //
    for (index = 0; index < paramString.length; index += 1) {
        // Break?
        //
        insert_break = Unicode.CheckBreakAtIndex(paramString, index);
        if (insert_break) {
            result += ' ' + paramString.charAt(index);
        } else {
            result += paramString.charAt(index);
        }
    }

    return result;
};

SearchClient.SearchQueryToExpressions = function (param_search_query, param_all_synonyms) {
    'use strict';

    var result, prefix_expression, suffix_expression, words_and_phrases, index, word_or_phrase, expression;

    result = [];
    prefix_expression = '[\u201C\u201D\u0022\u0027\u2018\u2019]?';
    suffix_expression = '[\\?\\.,:\u201C\u201D\u0022\u0027\u2018\u2019]?';
    if (param_search_query !== undefined) {
        words_and_phrases = SearchClient.ParseWordsAndPhrases(param_search_query.toLowerCase());
        words_and_phrases = SearchClient.AddSynonyms(words_and_phrases, param_all_synonyms);
        for (index = 0; index < words_and_phrases.length; index += 1) {
            word_or_phrase = words_and_phrases[index][0];

            // Avoid highlighting everything
            //
            if (word_or_phrase !== '*') {
                expression = SearchClient.EscapeRegExg(word_or_phrase);
                expression = SearchClient.SearchReplace(expression, '.*', '\\S*');

                // Handle single quote variations (left, right, straight)
                //
                expression = SearchClient.SearchReplace(expression, '\u0027', '\r');
                expression = SearchClient.SearchReplace(expression, '\u2019', '\r');
                expression = SearchClient.SearchReplace(expression, '\r', '[\\u0027|\\u2019]');

                expression = prefix_expression + expression + suffix_expression;
                result.push(expression);
            }
        }
    }

    return result;
};

SearchClient.AddSynonyms = function (param_words_and_phrases, param_all_synonyms) {
    'use strict';

    var result_words, result_phrases, index, word_or_phrase, word_as_regex_pattern, word_as_regex, synonym;

    result_words = new Array();
    result_phrases = new Array();

    for (index = 0; index < param_words_and_phrases.length; index += 1) {
        word_or_phrase = param_words_and_phrases[index][0];
        if(param_words_and_phrases[index][1] == 'p'){
            // Phrase
            SearchClient.phraseGeneration(
                word_or_phrase.split(" "),
                0,
                param_all_synonyms
            ).map(
                function(phrase) {
                    return result_phrases.push([phrase, 'p']);
                }
            );
        } else if (param_words_and_phrases[index][1] == 'l'){
          // Last Word (with wildcard suffix: .*), ignore
          //
        } else {
            // Word
            word_as_regex_pattern = SearchClient.WordToRegExpPattern(word_or_phrase);
            word_as_regex_pattern = word_as_regex_pattern.substring(0, word_as_regex_pattern.length - 1) + '.*$';
            word_as_regex = new window.RegExp(word_as_regex_pattern);
            for(synonym in param_all_synonyms)
                if(word_as_regex.test(synonym))
                    param_all_synonyms[synonym].map(function(word) {return result_words.push([word, 'w']);});
        }
    }

    return param_words_and_phrases.concat(GetTermsFromArray(result_words)).concat(GetTermsFromArray(result_phrases));
};

SearchClient.phraseGeneration = function (param_phrase, param_phrase_index, param_synonyms){
    'use strict';

    if(param_phrase_index >= param_phrase.length)
        return [];

    var result, synonym, original_word, index, synonyms_array;

    result = [];

    synonyms_array = param_synonyms[param_phrase[param_phrase_index]];
    if(synonyms_array !== undefined && synonyms_array.length > 0){
        result = result.concat(SearchClient.phraseGeneration(param_phrase, param_phrase_index + 1, param_synonyms));
        for(index = 0; index < synonyms_array.length; index++){
            synonym = synonyms_array[index];
            original_word = param_phrase[param_phrase_index];
            param_phrase[param_phrase_index] = synonym;
            result.push(param_phrase.join(" "));
            result = result.concat(SearchClient.phraseGeneration(param_phrase, param_phrase_index + 1, param_synonyms));
            param_phrase[param_phrase_index] = original_word;
        }
    }
     else
         result = result.concat(SearchClient.phraseGeneration(param_phrase, param_phrase_index + 1, param_synonyms));

    return result;
};

SearchClient.ParseSearchWords = function (paramSearchWordsString, paramMinimumWordLength, paramStopWords) {
    'use strict';

    var result_words, preliminary_phrases, wordsAndPhrases, wordsAndPhrasesIndex, wordOrPhrase, words, wordsIndex, word, result_phrases, phraseIndex, preliminary_phrase, result, word_entry;

    result_words = [];
    preliminary_phrases = [];

    // Add search words to hash
    //
    wordsAndPhrases = SearchClient.ParseWordsAndPhrases(paramSearchWordsString);
    for (wordsAndPhrasesIndex = 0; wordsAndPhrasesIndex < wordsAndPhrases.length; wordsAndPhrasesIndex += 1) {
        wordOrPhrase = SearchClient.ApplyWordBreaks(wordsAndPhrases[wordsAndPhrasesIndex][0]);
        words = SearchClient.ParseWordsAndPhrases(wordOrPhrase);

        // Phrase?
        //
        if (words.length > 1) {
            preliminary_phrases[preliminary_phrases.length] = [];
        }

        // Process words
        //
        for (wordsIndex = 0; wordsIndex < words.length; wordsIndex += 1) {
            word = words[wordsIndex][0];

            // Skip words below the minimum word length
            //
            if ((word.length > 0) && (word.length >= paramMinimumWordLength)) {
                // Skip stop words when not processing the last word (which has implicit wildcard)
                //
                if (paramStopWords[word] === undefined || wordsIndex === words.length - 1) {
                    // Add to search words list
                    //
                    word_entry = [word, wordsAndPhrases[wordsAndPhrasesIndex][1]];
                    result_words.push(word_entry);

                    // Add to phrase words list (if necessary)
                    //
                    if (words.length > 1) {
                        preliminary_phrases[preliminary_phrases.length - 1].push(word);
                    }
                }
            }
        }
    }

    // Ensure all phrases contain multiple words
    //
    result_phrases = []
    for (phraseIndex = 0; phraseIndex < preliminary_phrases.length; phraseIndex += 1) {
        preliminary_phrase = preliminary_phrases[phraseIndex];

        if (preliminary_phrase.length > 1) {
            result_phrases.push(preliminary_phrase);
        }
    }

    result = { 'words': result_words, 'phrases': result_phrases };

    return result;
};

SearchClient.ComparePageWithScore = function (param_alpha, param_beta) {
    'use strict';

    var result = 0;

    if (param_alpha.score < param_beta.score) {
        result = 1;
    } else if (param_alpha.score > param_beta.score) {
        result = -1;
    }

    return result;
};
