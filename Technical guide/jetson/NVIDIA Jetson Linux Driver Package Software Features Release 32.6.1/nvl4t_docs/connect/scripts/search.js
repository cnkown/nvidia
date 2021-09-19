// Copyright (c) 2010-2020 Quadralay Corporation.  All rights reserved.
//
// ePublisher 2020.1
//

// IMPORTANT: global variables are modified by search.xsl and should not be changed.
var GLOBAL_MINIMUM_WORD_LENGTH = 3;
var GLOBAL_STOP_WORDS_ARRAY = 'a about after all also am an and another any are as at be because been before being between both but by came can come copyright corp corporation could did do does each etc for from get goes got had has have he her here him himself his how if in inc into is it its let like make many me might more most much must my never nor not now of off on one only or other our out over own reserved rights said same see set shall she should since so some still such take than that the their them then there these they this those though through to too under us use very was way we well were what when where which while who why will with would yes yet you your'.split(' ');
var GLOBAL_NO_SEARCH_RESULTS_CONTAINER_HTML = '<div>(no results)</div>';

// Search
//
var Search = {
  'window': window,
  'control': undefined,
  'loading': false,
  'query': '',
  'connect_info': null,
  'group_titles': {},
  'executing': false,
  'cancel': false,
  'ready': false
};

Search.KnownParcelURL = function (param_url) {
  'use strict';

  var result;

  result = Parcels.KnownParcelURL(Search.connect_info.parcel_prefixes, param_url);

  return result;
};

Search.KnownParcelBaggageURL = function (param_url) {
  'use strict';

  var result;

  result = Parcels.KnownParcelBaggageURL(Search.connect_info.parcel_prefixes, param_url);

  return result;
};

Search.ScopeChanged = function () {
  'use strict';

  // Reset data queue
  //
  Search.control.data_queue = undefined;

  // Trigger search
  //
  Search.control.execute(Search.query);
};

Search.InBrowser_Object = function () {
  'use strict';

  var stop_words_array, stop_words_array_index, stop_word;

  // Search configuration
  //
  this.minimum_word_length = GLOBAL_MINIMUM_WORD_LENGTH;
  stop_words_array = GLOBAL_STOP_WORDS_ARRAY;
  this.stop_words = {};
  for (stop_words_array_index = 0; stop_words_array_index < stop_words_array.length; stop_words_array_index += 1) {
    stop_word = stop_words_array[stop_words_array_index];
    if (stop_word.length > 0) {
      this.stop_words[stop_word] = 1;
    }
  }

  // Track progress
  //
  this.progress = new Progress_Object(Search.window.document.getElementById('progress'));
  this.progress.Reset();

  // Initialize search data
  //
  this.data_queue = undefined;
  this.loadDataQueue = function () {
    'use strict';

    var this_reference, data_entry, script_element, ajax,
      search_scope_selections, search_scope_value,
      search_scope_data_indexes, scoped_data, search_scope_data_index, data_index, info;

    this_reference = this;


    // Initialize data queue?
    //
    if (this.data_queue === undefined) {
      this.data_queue = Search.connect_info.parcel_sx.slice(0);
    }

    // Need to load search data?
    //
    if (this.data_queue.length > 0) {
      data_entry = this.data_queue.shift();

      // Show progress (if data load is not nearly instant)
      //
      Search.window.setTimeout(function () {
        if (!this_reference.progress.Done()) {
          this_reference.progress.Show();
        }
      }, 250);

      // Load data
      //
      if (window.document.location.protocol === 'file:') {
        // Advance progress
        //
        Search.control.advance = function (param_info) {
          // Track data
          //
          Search.control.data.push(param_info);

          // Update progress
          //
          this_reference.progress.Update((Search.control.data.length / Search.connect_info.parcel_sx.length) * 100);

          // Invoke method to load more data or perform search
          //
          Search.window.setTimeout(function () {
            Search.control.loadDataQueue();
          });
        };

        // Use script element
        //
        script_element = Search.window.document.createElement('script');
        script_element.src = data_entry;
        Search.window.document.body.appendChild(script_element);
      } else {
        // Use AJAX
        //
        ajax = Browser.GetAJAX(window);

        ajax.onreadystatechange = function () {
          var info_as_text, info_prefix, info_suffix, info_data;

          if (ajax.readyState === 4) {
            // Prep info
            //
            info_as_text = ajax.responseText;
            info_prefix = 'var info =';
            info_suffix = ';Search.control.advance(info);';
            info_as_text = info_as_text.substring(
              info_as_text.indexOf(info_prefix) + info_prefix.length,
              info_as_text.lastIndexOf(info_suffix)
            );

            // Parse JSON
            //
            info_data = JSON.parse(info_as_text);

            // Track data
            //
            Search.control.data.push(info_data);

            // Update progress
            //
            this_reference.progress.Update((Search.control.data.length / Search.connect_info.parcel_sx.length) * 100);

            // Invoke method to load more data or perform search
            //
            Search.window.setTimeout(function () {
              Search.control.loadDataQueue();
            });
          }
        };

        ajax.open('GET', data_entry, true);
        ajax.send(null);
      }
    } else {
      // Hide progress
      //
      this.progress.Hide();

      // Determine parcel data to process
      //
      search_scope_selections = Search.connect_info.search_scope_selections;

      scoped_data = this.data;

      if (search_scope_selections !== undefined &&
        ((this.data.length > 1) && (search_scope_selections.length > 0))) {
        scoped_data = [];
        search_scope_data_indexes = [];

        for (var i = 0; i < search_scope_selections.length; i++) {
          search_scope_value = search_scope_selections[i];

          search_scope_data_indexes = search_scope_data_indexes.concat(Search.connect_info.search_scope_map[search_scope_value]);
        }

        for (search_scope_data_index = 0; search_scope_data_index < search_scope_data_indexes.length; search_scope_data_index += 1) {
          data_index = search_scope_data_indexes[search_scope_data_index];
          scoped_data.push(this.data[data_index]);
        }
      }

      if (Search.control.progress.Done()) {
        Search.query = Search.connect_info.query;
        Search.Execute(Search.query);
      }
    }
  };
  this.data = [];
  this.page_pairs_data = {};
  this.all_synonyms = {};

  this.setSearchCompleteCallback = function (param_object, param_method) {
    this.search_complete = { object: param_object, method: param_method };
  };

  this.setLinkTarget = function (param_target) {
    this.target = param_target;
  };

  this.execute = function (param_search_words) {
    var this_reference, data, data_entry, script_element, ajax, words_and_phrases,
      words, words_to_patterns, word_pattern_matches, word_index, word, is_word_last_word,
      word_as_regex_pattern, patterns_to_matches, search_scope_select, search_scope_value,
      search_scope_data_indexes, scoped_data, search_scope_data_index, data_index, info,
      word_as_regex, page_matches, page_match_index, page, page_with_score, word_page_matches,
      matched_words, first_page_match, pages, pages_to_check, page_id, pages_to_remove,
      synonymIndex, synonym, syn_word, synonym_as_regex_pattern, synonym_as_regex;

    // Data loaded?
    //
    Search.executing = true;

    this_reference = this;
    if (Search.connect_info === null) {
      Search.window.setTimeout(function () {
        this_reference.execute(param_search_words);
      }, 100);

      return;
    }

    // Prevent search for '*'
    //
    if (param_search_words === '*' || param_search_words === '') {
      Search.control.clearAllResults();

      return;
    }

    // Initialize data queue?
    //
    if (this.data_queue === undefined) {
      this.loadDataQueue();
    }

    this.progress.Hide();

    this_reference.performAfterDelay(function () {

      // Get words
      //
      words_and_phrases = SearchClient.ParseSearchWords(param_search_words.toLowerCase(), this_reference.minimum_word_length, this_reference.stop_words);
      words = words_and_phrases['words'];
      words_to_patterns = {};
      word_pattern_matches = {};

      this_reference.performAfterDelay(function () {
        for (word_index = 0; word_index < words.length; word_index += 1) {

          word = words[word_index][0];

          // words[#][1] indicates context of word to match
          // can be one of: 'w' => word to match
          //                'l' => last word detected to match
          //                'p' => word to match that is part of phrase
          is_word_last_word = words[word_index][1] == 'l';

          // Translate word to regular expression
          //
          word_as_regex_pattern = SearchClient.WordToRegExpPattern(word);

          // Handle single quote variations (left, right, straight)
          //
          word_as_regex_pattern = SearchClient.SearchReplace(word_as_regex_pattern, '\u0027', '\r');
          word_as_regex_pattern = SearchClient.SearchReplace(word_as_regex_pattern, '\u2019', '\r');
          word_as_regex_pattern = SearchClient.SearchReplace(word_as_regex_pattern, '\r', '[\\u0027|\\u2019]');

          // Add wildcard to last word
          //
          if (is_word_last_word) {
            word_as_regex_pattern = word_as_regex_pattern.substring(0, word_as_regex_pattern.length - 1) + '.*$';
          }

          // Cache word to pattern result
          //
          words_to_patterns[word] = word_as_regex_pattern;

          word_pattern_matches[word_as_regex_pattern] = [];
        }

        this_reference.performAfterDelay(function () {
          // Determine parcel data to process
          //
          var search_scope_selections = Search.connect_info.search_scope_selections;

          scoped_data = this_reference.data;

          if (search_scope_selections !== undefined &&
            ((this_reference.data.length > 1) && (search_scope_selections.length > 0))) {
            scoped_data = [];
            search_scope_data_indexes = [];

            for (var i = 0; i < search_scope_selections.length; i++) {

              search_scope_value = search_scope_selections[i];

              search_scope_data_indexes = search_scope_data_indexes.concat(Search.connect_info.search_scope_map[search_scope_value]);
            }

            for (search_scope_data_index = 0; search_scope_data_index < search_scope_data_indexes.length; search_scope_data_index += 1) {

              data_index = search_scope_data_indexes[search_scope_data_index];
              scoped_data.push(this_reference.data[data_index]);
            }
          }

          // Process scoped data
          //

          this_reference.performAfterDelay(function () {
            patterns_to_matches = {};
            this_reference.all_synonyms = {};
            for (data_index = 0; data_index < scoped_data.length; data_index += 1) {

              info = scoped_data[data_index];
              this_reference.all_synonyms = info.synonyms;

              // Search info for word matches
              //
              for (word_as_regex_pattern in word_pattern_matches) {

                if (typeof word_pattern_matches[word_as_regex_pattern] === 'object') {
                  word_as_regex = new window.RegExp(word_as_regex_pattern);

                  // Check each word for a match
                  //
                  for (word in this_reference.all_synonyms) {

                    if (typeof this_reference.all_synonyms[word] === 'object') {
                      // Match?
                      //
                      if (word_as_regex.test(word)) {
                        for (synonymIndex = 0; synonymIndex < this_reference.all_synonyms[word].length; synonymIndex++) {

                          synonym = this_reference.all_synonyms[word][synonymIndex];
                          synonym_as_regex_pattern = word_as_regex_pattern.substring(word_as_regex_pattern.length - 3) == ".*$" ? "^" + synonym + ".*$" : "^" + synonym + "$";
                          synonym_as_regex = new window.RegExp(synonym_as_regex_pattern);

                          for (syn_word in info.words) {

                            this_reference.searchWord(syn_word, synonym_as_regex, info.words, page_matches, info.pages, word_pattern_matches, word_as_regex_pattern, patterns_to_matches);
                          }
                        }
                      }
                    }
                  }

                  for (word in info.words) {

                    this_reference.searchWord(word, word_as_regex, info.words, page_matches, info.pages, word_pattern_matches, word_as_regex_pattern, patterns_to_matches);
                  }
                }
              }
            }

            // Combine search results for each word pattern
            //
            this_reference.performAfterDelay(function () {
              var temp_page_id = ""; // enforce uniqueness, page_id = url_or_path + " " + group_guid

              first_page_match = true;
              pages = {};
              for (word_as_regex_pattern in word_pattern_matches) {

                if (typeof word_pattern_matches[word_as_regex_pattern] === 'object') {
                  word_page_matches = word_pattern_matches[word_as_regex_pattern];

                  if (word_page_matches.length === 0) {
                    // Based on implicit AND there are no results possible for this query
                    //
                    var word_from_pattern = function () {
                      for (var prop in words_to_patterns) {
                        if (words_to_patterns.hasOwnProperty(prop)) {
                          if (words_to_patterns[prop] === word_as_regex_pattern) {
                            return prop;
                          }
                        }
                      }
                    }();

                    if (typeof this_reference.stop_words[word_from_pattern] === "number") {
                      continue;
                    } else {
                      pages = {};
                      break;
                    }
                  }

                  if (first_page_match) {
                    // Add all pages
                    //
                    for (page_match_index = 0; page_match_index < word_page_matches.length; page_match_index += 1) {

                      page_with_score = word_page_matches[page_match_index];
                      temp_page_id = page_with_score.page[0] + ' ' + page_with_score.page[5];

                      if (pages[temp_page_id] !== undefined) {
                        if (pages[temp_page_id].score < page_with_score.score) {
                          pages[temp_page_id] = page_with_score;
                        }
                      }
                      else {
                        pages[temp_page_id] = page_with_score;
                      }
                    }
                  } else {
                    // Based on implicit AND, combine like pages and remove pages not present in both page lists
                    //
                    pages_to_check = {};
                    for (page_match_index = 0; page_match_index < word_page_matches.length; page_match_index += 1) {

                      page_with_score = word_page_matches[page_match_index];
                      temp_page_id = page_with_score.page[0] + ' ' + page_with_score.page[5]

                      pages_to_check[temp_page_id] = 1;

                      // Combine scoring info
                      //
                      if (pages[temp_page_id] !== undefined) {
                        pages[temp_page_id].score += page_with_score.score;
                      }
                    }
                    pages_to_remove = {};
                    for (page_id in pages) {

                      if (typeof pages[page_id] === 'object') {
                        if (pages_to_check[page_id] === undefined) {
                          pages_to_remove[page_id] = true;
                        }
                      }
                    }
                    for (page_id in pages_to_remove) {

                      if (typeof pages_to_remove[page_id] === 'boolean') {
                        delete pages[page_id];
                      }
                    }
                  }

                  first_page_match = false;
                }
              }

              // Load phrase data
              //
              this_reference.performAfterDelay(function () {
                Search.control.phraseData(pages, words_and_phrases['phrases'], words_to_patterns, patterns_to_matches);
              });
            });
          });
        });
      });
    });
  };

  this.searchWord = function (param_word_to_search, param_word_as_regex, param_words_dictionary, page_matches, param_pages, param_word_pattern_matches, param_word_as_regex_pattern, param_patterns_to_matches) {
    var page_match_index, page, page_with_score, matched_words;

    if (typeof param_words_dictionary[param_word_to_search] === 'object') {
      page_matches = param_words_dictionary[param_word_to_search];

      // Match?
      //
      if (param_word_as_regex.test(param_word_to_search)) {
        // Add page info (page index and score alternate)
        //
        for (page_match_index = 0; page_match_index < page_matches.length; page_match_index += 2) {

          page = param_pages[page_matches[page_match_index]];
          page_with_score = { 'page': page, 'score': page_matches[page_match_index + 1] };
          param_word_pattern_matches[param_word_as_regex_pattern].push(page_with_score);
        }

        // Add param_word_to_search to match list for phrase processing
        //
        if (typeof param_patterns_to_matches[param_word_as_regex_pattern] !== 'object') {
          param_patterns_to_matches[param_word_as_regex_pattern] = {};
        }
        matched_words = param_patterns_to_matches[param_word_as_regex_pattern];
        matched_words[param_word_to_search] = true;
      }
    }
  };

  this.phraseData = function (param_pages, param_phrases, param_words_to_patterns, param_patterns_to_matches) {
    var done, page_id, page, page_pair_url, script_element, ajax;

    // Any phrases to check?
    //
    done = true;
    if (param_phrases.length > 0) {
      // Ensure all necessary page pairs loaded
      //
      for (page_id in param_pages) {

        if (typeof param_pages[page_id] === 'object') {
          // Page pairs loaded?
          //
          if (typeof Search.control.page_pairs_data[page_id] !== 'object') {
            // Get page data
            //
            page = param_pages[page_id];
            page_pair_url = Search.connect_info.base_url + page['page'][3];

            // Load data
            //
            if (window.document.location.protocol === 'file:') {
              // Advance progress
              //
              Search.control.loadWordPairs = function (param_pairs) {
                // Track data
                //
                Search.control.page_pairs_data[page_id] = param_pairs;

                // Invoke method to load more data or perform further processing
                //
                Search.control.phraseData(param_pages, param_phrases, param_words_to_patterns, param_patterns_to_matches);
              };

              // Use script element
              //
              script_element = Search.window.document.createElement('script');
              script_element.src = page_pair_url;
              Search.window.document.body.appendChild(script_element);
            } else {
              // Use AJAX
              //
              ajax = Browser.GetAJAX(window);

              ajax.onreadystatechange = function () {
                var pairs_as_text, pairs_prefix, pairs_suffix, pairs;

                if (ajax.readyState === 4) {
                  // Prep data
                  //
                  pairs_as_text = ajax.responseText;
                  pairs_prefix = 'var pairs =';
                  pairs_suffix = ';Search.control.loadWordPairs(pairs);';
                  pairs_as_text = pairs_as_text.substring(
                    pairs_as_text.indexOf(pairs_prefix) + pairs_prefix.length,
                    pairs_as_text.lastIndexOf(pairs_suffix)
                  );

                  // Parse JSON
                  //
                  pairs = JSON.parse(pairs_as_text);

                  // Track data
                  //
                  Search.control.page_pairs_data[page_id] = pairs;

                  // Invoke method to load more data or perform further processing
                  //
                  Search.control.phraseData(param_pages, param_phrases, param_words_to_patterns, param_patterns_to_matches);
                }
              };

              ajax.open('GET', page_pair_url, true);
              ajax.send(null);
            }

            // Not done, need to load some data
            //
            done = false;
            break;
          }
        }
      }
    }

    // Done?
    //
    if (done) {
      Search.control.performAfterDelay(function () {
        Search.control.phraseCheck(param_pages, param_phrases, param_words_to_patterns, param_patterns_to_matches);
      });
    }
  };

  this.phraseCheckPairs = function (param_phrase, param_index, param_page_pairs, param_words_to_patterns, param_patterns_to_matches) {
    var result, first_word, second_word, first_pattern, second_pattern, first_matches, first_match, following_words, second_matches, second_match;

    // Initialize result
    //
    result = false;

    // Get word pair
    //
    first_word = param_phrase[param_index];
    second_word = param_phrase[param_index + 1];

    // Convert to patterns
    //
    first_pattern = param_words_to_patterns[first_word];
    second_pattern = param_words_to_patterns[second_word];

    // Iterate pattern matches and search for a hit on the page
    //
    first_matches = param_patterns_to_matches[first_pattern];

    for (first_match in first_matches) {

      if (typeof first_matches[first_match] === 'boolean') {
        // Check for word on page
        //
        if (typeof param_page_pairs[first_match] === 'object') {
          // Access following words hash
          //
          following_words = param_page_pairs[first_match];

          // Found a possibility, check the second word
          //
          second_matches = param_patterns_to_matches[second_pattern];

          //If the last word in a phrase is a stop word, set result and break
          //
          if (typeof this.stop_words[second_word] === 'number') {
            result = true;
            break;
          }
          for (second_match in second_matches) {

            if (typeof second_matches[second_match] === 'boolean') {
              // Check for second word after first word
              //
              if (following_words[second_match] === 1) {
                // Works (so far)
                // Either return success if last word pair or check next set
                //
                if ((param_index + 2) === param_phrase.length) {
                  // At the end of the phrase
                  //
                  result = true;
                } else {
                  // Check succeeding pairs
                  //
                  result = Search.control.phraseCheckPairs(param_phrase, param_index + 1, param_page_pairs, param_words_to_patterns, param_patterns_to_matches);
                }
              }
            }

            // Early exit on success
            //
            if (result) {
              break;
            }
          }
        }
      }

      // Early exit on success
      //
      if (result) {
        break;
      }
    }

    return result;
  };

  this.phraseCheck = function (param_pages, param_phrases, param_words_to_patterns, param_patterns_to_matches) {
    var pages_to_remove, page_id, page_pairs, phrase_index, matches, phrase;


    // Prepare to remove invalid pages
    //
    pages_to_remove = {};

    // Check phrases
    //
    if (param_phrases.length > 0) {
      // Review each page
      //
      for (page_id in param_pages) {

        if (typeof param_pages[page_id] === 'object') {
          // Access page pairs
          //
          page_pairs = Search.control.page_pairs_data[page_id];

          // Ensure all phrases occur in this page
          //
          matches = true;
          for (phrase_index = 0; phrase_index < param_phrases.length; phrase_index += 1) {

            phrase = param_phrases[phrase_index];

            // Check word pairs in the phrase
            //
            matches = Search.control.phraseCheckPairs(phrase, 0, page_pairs, param_words_to_patterns, param_patterns_to_matches);

            // Early exit on first failed phrase
            //
            if (!matches) {
              break;
            }
          }

          // No match, so remove page from results
          //
          if (!matches) {
            pages_to_remove[page_id] = true;
          }
        }
      }
    }

    // Remove invalid pages
    //
    for (page_id in pages_to_remove) {

      if (typeof pages_to_remove[page_id] === 'boolean') {
        delete param_pages[page_id];
      }
    }

    // Display results
    //
    Search.control.performAfterDelay(function () {
      Search.control.displayResults(param_pages);
    });
  };

  this.displayResults = function (param_pages) {
    var pages_array, page_id, pages_array_index, buffer, page_with_score, page, container,
      search_results_count_container, this_reference;

    // Sort pages by rank
    //
    pages_array = [];
    this_reference = this;
    for (page_id in param_pages) {

      if (typeof param_pages[page_id] === 'object') {
        pages_array.push(param_pages[page_id]);
      }
    }
    if (pages_array.length > 0) {
      pages_array = pages_array.sort(SearchClient.ComparePageWithScore);
    }

    // Display results
    //
    Search.control.performAfterDelay(function () {
      buffer = [];
      for (pages_array_index = 0; pages_array_index < pages_array.length; pages_array_index += 1) {

        page_with_score = pages_array[pages_array_index];
        page = page_with_score.page;

        // Do not show files that have zero relevance from search results.
        //
        if (page_with_score.score > 0) {
          var pageUri, pageType, groupTitle;

          pageUri = SearchClient.EscapeHTML(page[0]);
          pageType = page[4];
          groupTitle = Search.group_titles[page[5]];

          buffer.push('<div class="search_result">');

          if (pageUri) {
            var fileTypeIcons, resultTitleClasses;

            fileTypeIcons = '';
            resultTitleClasses = 'search_result_title';

            // Build HTML according to what type of search result this is
            //
            switch (pageType) {
              case 'internal-html':
                resultTitleClasses += ' search_result_internal_html';
                fileTypeIcons = '<i class="fa search_result_icon_html"></i>';
                break;
              case 'internal-pdf':
                resultTitleClasses += ' search_result_internal_pdf';
                fileTypeIcons = '<i class="fa search_result_icon_pdf"></i>';
                break;
              case 'external-html':
                resultTitleClasses += ' search_result_external_html';
                fileTypeIcons = '<i class="fa search_result_icon_external"></i>' +
                  '<i class="fa search_result_icon_html"></i>';
                break;
              case 'external-pdf':
                resultTitleClasses += ' search_result_external_html';
                fileTypeIcons = '<i class="fa search_result_icon_external"></i>' +
                  '<i class="fa search_result_icon_pdf"></i>';
                break;
              case 'content-page':
              default:
                resultTitleClasses += ' search_result_content_page';
                break;
            }

            buffer.push('<div class="' + resultTitleClasses + '">');

            if ((pageUri.toLowerCase().indexOf('http:') == 0) || (pageUri.toLowerCase().indexOf('https:') == 0)) {
              buffer.push('<a target="connect_page" href="' + pageUri + '">' + SearchClient.EscapeHTML(page[1]) + '</a>');
            }
            else {
              buffer.push('<a target="connect_page" href="../' + pageUri + '">' + SearchClient.EscapeHTML(page[1]) + '</a>');
            }

            buffer.push(fileTypeIcons);

            buffer.push('</div>');
          }
          if (page[2].length > 0) {
            buffer.push('<div class="search_result_summary">' + SearchClient.EscapeHTML(page[2]) + '</div>');
          }

          if (groupTitle !== '' && groupTitle !== undefined && groupTitle !== null) {
            buffer.push('<div class="search_result_group_name">' + groupTitle + '</div>');
          }

          buffer.push('</div>');
        }
      }

      container = window.document.getElementById('search_results_container');

      search_results_count_container = window.document.getElementById('search_results_count_container');
      if (search_results_count_container !== null && !isNaN(pages_array.length)) {
        Search.SearchResultCount(pages_array.length);
      }

      if (buffer.length === 0) {
        container.innerHTML = GLOBAL_NO_SEARCH_RESULTS_CONTAINER_HTML;
      } else {
        container.innerHTML = buffer.join('\n');
      }

      this_reference.search_complete.method.call(this_reference.search_complete.object, this_reference.search_complete.object, null);
    });
  };

  this.clearAllResults = function () {
    var container, data, search_results_count_container;

    container = window.document.getElementById('search_results_container');
    container.innerHTML = '';

    search_results_count_container = window.document.getElementById('search_results_count_container');
    if (search_results_count_container !== null) {
      search_results_count_container.style.display = 'none';
    }

    data = {
      'action': 'search_complete',
      'query': Search.query,
      'dimensions': Browser.GetWindowContentWidthHeight(Search.window)
    };
    Message.Post(Search.window.parent, data, Search.window);
  };

  this.performAfterDelay = function (param_function) {
    if (!Search.cancel && Search.query.length > 0) {
      setTimeout(param_function);
    } else {
      Search.executing = false;
      Search.cancel = false;
    }
  };
};

Search.Execute = function (param_query) {
  'use strict';

  var search_input;

  // Check for a search query string and execute it
  //
  if (Search.control.progress.Done()) {
    // Update search words
    //
    if (Search.executing && (Search.query !== param_query)) {
      Search.cancel = true;
    }
    if (param_query !== undefined) {
      Search.query = param_query;
    }

    if (Search.query !== '') {
      if (Search.executing) {
        // Try again while search cancels
        //
        setTimeout(function () {
          Search.Execute(Search.query);
        });
      } else {
        // Search!
        //
        Search.control.execute(Search.query);
        Search.cancel = false;
        Search.executing = false;
      }
    } else {
      Search.control.clearAllResults();
    }
  }
  else {
    Search.control.loadDataQueue();
  }
};

Search.Listen = function (param_event) {
  'use strict';

  if (Search.dispatch === undefined) {
    Search.dispatch = {
      'search_load': function (param_data) {
        Search.Load();
      },
      'search_get_page_size': function (param_data) {
        var data;

        data = {
          'action': 'search_page_size',
          'dimensions': Browser.GetWindowContentWidthHeight(Search.window),
          'stage': param_data.stage
        };
        Message.Post(Search.window.parent, data, Search.window);
      },
      'search_connect_info': function (param_data) {
        var data;

        if (!Search.ready) {
          Search.Load();
        } else {
          Search.connect_info = param_data;

          delete Search.connect_info['action'];

          // Load filter message
          //
          if (Search.connect_info.search_scope_selection_titles !== undefined) {
            if (Search.connect_info.search_scope_map !== undefined) {
              document.getElementById('search_filter_message_container').style.display = 'block';
              document.getElementById('search_filter_by_groups').innerHTML = Search.connect_info.search_scope_selection_titles
            }
            else {
              document.getElementById('search_filter_message_container').style.display = 'none';
            }
          }

          // Load Group titles to object for Search Results
          //
          if (Search.connect_info.search_scopes !== undefined) {
            Search.CreateGroupTitlesObject(Search.connect_info.search_scopes);
          }

          Search.Execute(param_data.query);
        }
      }
    };
  }

  try {
    // Dispatch
    //
    Search.dispatch[param_event.data.action](param_event.data);
  } catch (ignore) {
    // Keep on rolling
    //
  }
};

Search.SearchQueryHighlight = function (param_search_query) {
  'use strict';

  var search_results_container, expressions, html_elements, require_whitespace;

  // Locate search results container
  //
  search_results_container = window.document.getElementById('search_results_container');

  // Remove highlights
  //
  Highlight.RemoveFromHierarchy(Search.window.document, search_results_container, 'search_result_highlight');

  // Highlight words
  //
  if (param_search_query !== undefined && param_search_query !== '') {
    // Convert search query into expressions
    //
    expressions = SearchClient.SearchQueryToExpressions(param_search_query, Search.control.all_synonyms);

    // Apply highlights
    //
    require_whitespace = true;
    html_elements = Search.window.document.getElementsByTagName('html');
    if (html_elements.length > 0) {
      require_whitespace = (html_elements[0].getAttribute('data-highlight-require-whitespace') === 'true');
    }
    Highlight.ApplyToHierarchy(Search.window.document, search_results_container, 'search_result_highlight', expressions, require_whitespace);
  }
};

Search.SearchResultCount = function (param_result_count) {
  'use strict';

  var search_results_count_container, count_span, count_formatted;

  search_results_count_container = window.document.getElementById('search_results_count_container');
  search_results_count_container.style.display = 'block';

  count_span = window.document.getElementById('search_results_count');
  count_formatted = param_result_count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (count_span !== null) {
    count_span.innerHTML = count_formatted;
  }
};

Search.CreateGroupTitlesObject = function (param_search_scopes) {
  'use strict';

  var search_scopes, search_scope, scope_context, scope_title;

  search_scopes = param_search_scopes;

  if (typeof search_scopes !== 'undefined') {
    for (var i = 0; i < search_scopes.length; i++) {
      search_scope = search_scopes[i];

      if (typeof search_scope['title'] !== 'undefined' &&
        typeof search_scope['id'] !== 'undefined') {
        scope_context = search_scope['id'];
        scope_title = search_scope['title'];
        Search.group_titles[scope_context] = scope_title;
      }

      if (typeof search_scope['children'] !== 'undefined') {
        Search.CreateGroupTitlesObject(search_scope['children']);
      }
    }
  }
};

Search.SendWindowClicked = function () {
  'use strict';

  var data;

  data = {
    'action': 'search_page_clicked'
  };
  Message.Post(Search.window.parent, data, Search.window);
};

Search.SendSearchHelpfulButtonClick = function (param_value) {
  var data, helpful_rating_object, search_query;

  helpful_rating_object = Browser.GetLocalStorageItem('search_helpful_rating');

  if (helpful_rating_object !== null) {

   search_query = Search.query.replace(/\s+/g, " ").trim();

    if (!helpful_rating_object.hasOwnProperty(search_query) || helpful_rating_object[search_query] !== param_value) {

        helpful_rating_object[search_query] = param_value;

        try {
        Browser.UpdateLocalStorageItem('search_helpful_rating', helpful_rating_object);
      } catch (e) {
        helpful_rating_object = {};
        helpful_rating_object[search_query] = param_value;
        Browser.DeleteLocalStorageItem('search_helpful_rating');
        Browser.CreateLocalStorageItem('search_helpful_rating', helpful_rating_object);
      }

      Search.SetSelectedStateForHelpfulButton(param_value);

  data = {
        'action': 'search_helpful_button_click',
        'helpful': param_value,
        'href': Search.window.document.location.href
  };

  Message.Post(Search.window.parent, data, Search.window);
    } else {
      //do nothing
    }
   }
};

Search.Load = function () {
  'use strict';

  // Added new variable onSearchLinkClickInBaggage
  //
  var onSearchLinkClick, onSearchLinkClickInBaggage, onSearchLinkClickInExternalBaggage, onSearchComplete, search_page_load_data, helpful_button, unhelpful_button, helpful_rating;

  // Define callbacks
  //
  onSearchLinkClick = function (param_event) {
    var data;

    data = {
      'action': 'search_display_link',
      'href': this.href,
      'title': this.innerText
    };
    Message.Post(Search.window.parent, data, Search.window);

    return false;
  };

  // Created new function for passing info to the baggage file
  //
  onSearchLinkClickInBaggage = function (param_event) {
    var data, require_whitespace, html_elements;

    require_whitespace = true;
    html_elements = Search.window.document.getElementsByTagName('html');
    if (html_elements.length > 0) {
      require_whitespace = (html_elements[0].getAttribute('data-highlight-require-whitespace') === 'true');
    }

    data = {
      'wwreverbsearch_action': 'search_display_link',
      'wwreverbsearch_highlightRequireWhitespace': require_whitespace,
      'wwreverbsearch_query': Search.query,
      'wwreverbsearch_synonyms': Search.control.all_synonyms
    };

    window.localStorage['wwreverbsearch_search'] = JSON.stringify(data);
    window.open(this.href);

    return false;
  };

  // Created new function for passing info to the external baggage file
  //
  onSearchLinkClickInExternalBaggage = function (param_event) {
    var params, require_whitespace, html_elements;

    require_whitespace = true;
    html_elements = Search.window.document.getElementsByTagName('html');
    if (html_elements.length > 0) {
      require_whitespace = (html_elements[0].getAttribute('data-highlight-require-whitespace') === 'true');
    }

    params = "wwreverbsearch_action=search_display_link" +
      "&wwreverbsearch_highlightRequireWhitespace=" + Browser.EncodeURIComponentIfNotEncoded(require_whitespace) +
      "&wwreverbsearch_query=" + Browser.EncodeURIComponentIfNotEncoded(Search.query) +
      "&wwreverbsearch_synonyms=" + Browser.EncodeURIComponentIfNotEncoded(Search.control.all_synonyms);

    if (this.href.indexOf('?') === -1) {
      params = '?' + params;
    }
    else {
      params = '&' + params;
    }

    window.open(this.href + params);

    return false;
  };

  onSearchComplete = function (param_search_control, param_searcher) {
    var index, link, search_uri, encoded_search_uri, data;

    // Intercept search result links
    //
    for (index = 0; index < window.document.links.length; index += 1) {
      link = window.document.links[index];

      if (link.target === 'connect_page') {
        // Same hierarchy?
        //
        if (Browser.SameHierarchy(Search.connect_info.base_url, link.href)) {
          // Verify parcel is known
          //
          if ((Search.KnownParcelURL(link.href)) && (!Search.KnownParcelBaggageURL(link.href))) {
            // Handle via Connect run-time
            //
            link.onclick = onSearchLinkClick;
          } else {
            // Open in a new window
            //
            link.target = '_blank';
            // Assigning the new function to the onclick event
            //
            link.onclick = onSearchLinkClickInBaggage;
          }
        } else {
          // Open in a new window
          //
          link.target = '_blank';
          // Assigning the new function to the onclick event even when it's not of the SameHierarchy but it could be an External URL
          //
          link.onclick = onSearchLinkClickInExternalBaggage;
        }
      }
    }

    Browser.CreateLocalStorageItem('search_helpful_rating', {});

    helpful_button = document.getElementById('helpful_thumbs_up');
    unhelpful_button = document.getElementById('helpful_thumbs_down');

    if (helpful_button !== null && unhelpful_button !== null) {
      helpful_button.onclick = function () { Search.SendSearchHelpfulButtonClick('yes'); };
      unhelpful_button.onclick = function () { Search.SendSearchHelpfulButtonClick('no'); };

      helpful_rating = Search.GetHelpfulRating();

      if (helpful_rating !== undefined) {
        Search.SetSelectedStateForHelpfulButton(helpful_rating);
      } else {
        Search.ResetSelectedStateForHelpfulButtons();
      }
    }

    // Highlight search words and phrases
    //
    Search.SearchQueryHighlight(Search.query);

    // Notify parent
    //
    data = {
      'action': 'search_complete',
      'query': Search.query,
      'synonyms': Search.control.all_synonyms,
      'dimensions': Browser.GetWindowContentWidthHeight(Search.window)
    };
    Message.Post(Search.window.parent, data, Search.window);
    Search.executing = false;
    Search.cancel = false;
  };

  // Search control settings
  //
  Search.control = new Search.InBrowser_Object();
  Search.control.setSearchCompleteCallback(this, onSearchComplete);
  Search.control.setLinkTarget('connect_page');

  Browser.TrackDocumentChanges(Search.window, Search.window.document, Search.ContentChanged);
  Search.window.onresize = Search.ContentChanged;

  Search.ready = true;

  // Ready to search
  //
  search_page_load_data = {
    'action': 'search_page_load_data',
    'dimensions': Browser.GetWindowContentWidthHeight(Search.window)
  };
  Message.Post(Search.window.parent, search_page_load_data, Search.window);
};

Search.GetHelpfulRating = function () {
  var helpful_rating, helpful_rating_object, search_query;
  helpful_rating = null;

  search_query = Search.query.replace(/\s+/g, " ").trim();

  helpful_rating_object = Browser.GetLocalStorageItem('search_helpful_rating');
  if (helpful_rating_object !== null) {
    if (helpful_rating_object.hasOwnProperty(search_query)) {
      helpful_rating = helpful_rating_object[search_query];
    }
  }

  return helpful_rating;
};

Search.SetSelectedStateForHelpfulButton = function (param_helpful_rating) {
  'use strict';

  var helpful_button, unhelpful_button;

  helpful_button = document.getElementById("helpful_thumbs_up");
  unhelpful_button = document.getElementById("helpful_thumbs_down");

  helpful_button.className = Browser.ReplaceClass(helpful_button.className, 'ww_skin_was_this_helpful_button_selected', 'ww_skin_was_this_helpful_button');
  unhelpful_button.className = Browser.ReplaceClass(unhelpful_button.className, 'ww_skin_was_this_helpful_button_selected', 'ww_skin_was_this_helpful_button');

  if (param_helpful_rating == 'yes') {
    helpful_button.className = Browser.ReplaceClass(helpful_button.className, 'ww_skin_was_this_helpful_button', 'ww_skin_was_this_helpful_button_selected');
  } else if (param_helpful_rating == 'no') {
    unhelpful_button.className = Browser.ReplaceClass(unhelpful_button.className, 'ww_skin_was_this_helpful_button', 'ww_skin_was_this_helpful_button_selected');
  }
};

Search.ResetSelectedStateForHelpfulButtons = function () {
  var helpful_button, unhelpful_button;

  helpful_button = document.getElementById("helpful_thumbs_up");
  unhelpful_button = document.getElementById("helpful_thumbs_down");

  helpful_button.className = Browser.ReplaceClass(helpful_button.className, 'ww_skin_was_this_helpful_button_selected', 'ww_skin_was_this_helpful_button');
  unhelpful_button.className = Browser.ReplaceClass(unhelpful_button.className, 'ww_skin_was_this_helpful_button_selected', 'ww_skin_was_this_helpful_button');

};

Search.ContentChanged = function () {
  "use strict";

  var data;

  data = {
    action: "search_page_size",
    dimensions: Browser.GetWindowContentWidthHeight(Search.window)
  };

  Message.Post(Search.window.parent, data, Search.window);

  return true;
};

Search.HandleRedirect = function () {
  'use strict';

  if (Search.window === Search.window.top && Search.window.navigator.userAgent.indexOf('bot/') === -1) {
    // Redirect
    //
    var event_or_redirect_url;

    if (document.getElementById('search_onload_url')) {
      event_or_redirect_url = document.getElementById('search_onload_url').value;
    }

    if (event_or_redirect_url && typeof event_or_redirect_url === 'string') {
      var redirect_url;

      redirect_url = event_or_redirect_url;

      if (Search.window.document.location.hash.length > 1) {
        // Sanitize and append it
        //
        search_hash = Search.window.document.location.hash.substring(1);
        search_hash = search_hash.replace(/[\\<>:;"']|%5C|%3C|%3E|%3A|%3B|%22|%27/gi, '');
        redirect_url += '#' + search_hash;
      }

      Search.window.document.location.replace(redirect_url);
    }
  }
};

// Handle load
//
//Search.OnLoad = function () {
//  'use strict';
//
//   if (!Search.loading) {
//    Search.loading = true;
//    Search.Load();
//  }
//};

// Start running as soon as possible
//
if (window.addEventListener !== undefined) {
  window.addEventListener('load', Search.HandleRedirect, false);
} else if (window.attachEvent !== undefined) {
  window.attachEvent('onload', Search.HandleRedirect);
}

window.onclick = function (event) {
  Search.SendWindowClicked();
};

// Setup for listening
//
Message.Listen(window, function (param_event) {
  Search.Listen(param_event);
});