require(['gitbook', 'jQuery', 'lodash'], function (gitbook, $, _) {
    var allThreads = [];

    // Move content to the left
    // Calcul the right position
    function toggleComments(state) {
        var $wrapper = gitbook.state.$book.find('.page-wrapper');
        var $inner = $wrapper.find('.page-inner');
        var $nextNavigation = gitbook.state.$book.find('.navigation.navigation-next');

        $wrapper.toggleClass('comments-open', state);
        if (!$wrapper.hasClass('comments-open')) {
            $inner.css('left', 'auto');
        } else {
            var commentsWidth = 300;
            var innerWidth = $inner.width();
            var wrapperWidth = $wrapper.width();
            var navWidth = $nextNavigation.length == 0? 0 : $nextNavigation.width();
            var marginWidth = ((wrapperWidth - innerWidth) / 2) - navWidth;

            var left = (marginWidth-commentsWidth);
            left = Math.max(left, -commentsWidth);
            left = Math.min(left, 0);

            $inner.css('left', left+'px');
        }
    }

    // Fetch threads from gitbook.com and update listing
    function fetchThreads() {
        $.getJSON('http://localhost:5000/content/book/samypesse/test-beta/gitbook/api/comments/threads', {
            filename: gitbook.state.filepath
        }, function(result) {
            allThreads = result.list;
            console.log(allThreads);
            updateSections();
        });
    }

    // Return list of threads matching a section
    function filterThreads(section) {
        var words = section.split(' ');

        return _.filter(allThreads, function(thread) {
            var threadWords = (thread.context.section || '').split(' ');

            var commonWords = _.filter(threadWords, function(word) {
                return _.contains(words, word);
            });

            var matching = commonWords.length/threadWords.length;
            return matching > 0.8;
        });
    }

    // Create a new thread on th backend
    function postThread(subject, body, section) {
        $.post('http://localhost:5000/content/book/samypesse/test-beta/gitbook/api/comments/threads', {
            title: subject,
            body: body,
            context: {
                filename: gitbook.state.filepath,
                section: section
            }
        }, function(err, result) {
            console.log(err, result);
        });
    }

    // Create form to create thread
    function createThreadCreation($commentsArea, $section) {
        // Post area
        var $postArea = $('<div>', {
            'class': 'comments-post'
        });

        var $toolBar = $('<div>', {
            'class': 'comments-toolbar'
        });

        var $postButton = $('<a>', {
            'href': '#',
            'text': 'Post',
            'click': function(e) {
                e.preventDefault();

                postThread($input.val(), '', $section.text());
            }
        });

        $toolBar.append($postButton);

        var $input = $('<textarea>', {
            'placeholder': 'Start a new discussion'
        });


        $postArea.append($input);
        $postArea.append($toolBar);

        $commentsArea.html('');
        $commentsArea.append($postArea);

        $input.focus();
    }

    // Create and return a comment
    function createComment(comment) {
        var $comment = $('<div>', {
            'class': 'comment'
        });

        var $avatar = $('<a>', {
            'class': 'comment-avatar',
            'html': '<img src="'+comment.user.urls.avatar+'" />'
        });

        var $username = $('<a>', {
            'class': 'comment-user',
            'text': comment.user.name,
            'href': comment.user.urls.profile
        });

        var $body = $('<div>', {
            'class': 'comment-body'
        });

        var $content = $('<div>', {
            'class': 'comment-content',
            'text': comment.body || comment.title
        });

        $comment.append($avatar);
        $body.append($username);
        $body.append($content);
        $comment.append($body);

        return $comment;
    }

    // Display a thread and its comments
    function createThreadComments($commentsArea, $section, thread) {

        // Post area
        var $postArea = $('<div>', {
            'class': 'comments-post'
        });

        var $toolBar = $('<div>', {
            'class': 'comments-toolbar'
        });

        var $postButton = $('<a>', {
            'href': '#',
            'text': 'Post',
            'click': function(e) {
                e.preventDefault();

                postThread($input.val(), '', $section.text());
            }
        });

        $toolBar.append($postButton);

        var $input = $('<textarea>', {
            'placeholder': 'Leave a comment'
        });
        $postArea.append($input);
        $postArea.append($toolBar);


        var $comments = $('<div>', {
            'class': 'comments-list'
        });

        $comments.append(createComment(thread));



        $commentsArea.html('');
        $commentsArea.append($comments);
        $commentsArea.append($postArea);

        $input.focus();
    }

    // Create a list of threads to select one to show
    function createThreadsList($commentsArea, $section, threads) {
        var $threads = $('<ul>', {
            'class': 'comments-threads'
        });

        _.each(threads, function(thread) {
            var $thread = $('<li>', {
                'text': thread.title,
                'click': function(e) {
                    createThreadComments($commentsArea, $section, thread);
                }
            });
            $threads.append($thread);
        });

        // Link to create new thread
        var $toolBar = $('<div>', {
            'class': 'comments-toolbar'
        });

        var $postButton = $('<a>', {
            'href': '#',
            'text': 'New Thread',
            'click': function(e) {
                e.preventDefault();

                createThreadCreation($commentsArea, $section);
            }
        });
        $toolBar.append($postButton);



        $commentsArea.html('');
        $commentsArea.append($threads);
        $commentsArea.append($toolBar);
    }

    // Close all section
    function closeAllSections() {
        gitbook.state.$book.find('.page-wrapper .comments-section').removeClass('has-comments-open');
    }

    // Toggle comments display
    function toggleSection($section, threads) {
        var isOpen = !$section.hasClass('has-comments-open');
        closeAllSections();
        $section.toggleClass('has-comments-open', isOpen);
        toggleComments(isOpen);

        if (!isOpen) return;

        $section.find('.comments-area').remove();
        var $commentsArea = $('<div>', {
            'class': 'comments-area'
        });
        $section.append($commentsArea);

        // Has multiples threads
        if (threads.length > 1) {
            createThreadsList($commentsArea, $section, threads);
        } else if (threads.length == 1) {
            createThreadComments($commentsArea, $section, threads[0]);
        } else {
            createThreadCreation($commentsArea, $section);
        }
    }

    // Initialize comments system on a paragraph (aka section)
    function bindSection($section) {
        // Find matching threads with this section
        var threads = filterThreads($section.text());
        var nComments = _.reduce(threads, function(sum, thread) {
            return sum + 1 + thread.comments;
        }, 0);

        // Create marker
        var $marker = $('<div>', {
            'class': 'marker',
            'text': nComments? nComments : '+'
        });
        $marker.on('click', function() {
            toggleSection($section, threads);
        });

        var $icon = $('<div>', {
            'class': 'comments-icon'
        });
        $icon.append($marker);

        $section.addClass('comments-section');
        if (nComments > 0) $section.addClass('has-comments');
        $section.append($icon);
    }

    // Update all comments sections
    function updateSections() {
        var $wrapper = gitbook.state.$book.find('.page-wrapper');
        var $sections = $wrapper.find('p');

        $sections.each(function() {
            bindSection($(this));
        });
    }


    gitbook.events.bind('start', function (e, config) {

    });

    gitbook.events.bind('page.change', function () {
        allThreads = [];
        updateSections();
        fetchThreads();
    });
});
