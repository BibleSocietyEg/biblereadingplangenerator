

// EVENTS
$('#section-time input, ' + 
	'#section-days input, ' + 
	'#section-books input, ' + 
	'#section-options input, #options-language, ' + 
	'#section-format input').on('change keyup', updateDisplay);

// traditional ot/nt clicking
$('.order-traditional input').on('click', adjustBooks);
$('[name=bibleorder]').on('click', enableTestaments);

$('#download-ics').on('click', downloadics);
$('#download-pdf').on('click', downloadpdf);

function enableTestaments() {
	var check = $(this);

	check
		.closest('.order-group')
			.find('input[type=checkbox]')
				.prop('disabled',false)
			.end()
		.siblings('.order-group')
			.find('input[type=checkbox]')
			.prop('disabled',true);

}

function adjustBooks() {
	var check = $(this);
	
	if (check.closest('label').hasClass('books-testament')) {		
		// parent
		
		check
			.closest('details')
			.find('input')
			.prop('checked', check.prop('checked'));
		
	} else {
		
		var parent = check.closest('details').find('.books-testament input');
		
		if (check.prop('checked')) {
			// check others
			var allchecked = true;
			check.closest('.books-list').find('input').each(function() {
				if (!$(this).prop('checked')) {
					allchecked = false;
					return false;
				}
			});
			parent.prop('checked',allchecked);
		} else {
			parent.prop('checked',false);
		}
		
		
	}

	updateDisplay();
}

function downloadics() {
	var lang = $('#options-language').val();
	var code = generate(lang, 'ics');

	var blob = new Blob([code], {type: "text/calendar;charset=utf-8"});
	saveData(blob, 'bibleplan.ics');

	//window.open( "data:text/calendar;charset=utf8," + escape(html));

	//html = html.replace(/\n/gi,'<br>');	
}

function downloadpdf() {
	var doc = new jsPDF({unit:'in', format:'letter'}),
		margin = 0.75;

	// create heading
	doc.text('Bible Reading Plan', margin, margin, {align:'left'});

	// main code
	var format = $('input:radio[name="formatstyle"]:checked').val();
	var code = generate(format);
	
	//

	setTimeout(function(){
        var data = doc.output('datauri')
		//$('iframe').attr('src', data);
		$('#output').html('<iframe class="pdf" type="application/pdf" src="' + data + '"></iframe>');
    }, 10)

	// demo
	

	//doc.save('bible-reading-plan.pdf')	
}

function updateDisplay() {

	var format = $('input:radio[name="formatstyle"]:checked').val();
	var lang = $('#options-language').val();

	var code = generate(lang, format);

	if ($('#options-sectioncolors').is(':checked')) {
		$('#output').addClass('plan-color');
	} else {
		$('#output').removeClass('plan-color');
	}

	if ($('#options-checkbox').is(':checked')) {
		$('#output').addClass('plan-checkbox');
	} else {
		$('#output').removeClass('plan-checkbox');
	}	

	$('#output')
		.attr('lang', lang)
		.html(code);

	if (["ar","he"].indexOf(lang) > -1) {
		$('#output').attr('dir','rtl');
	} else {
		$('#output').attr('dir','ltr');
	}

	updateUrl();	
}

function generate(lang, format) {
	
	var 
		startDate = new Date($('#time-startdate').val()),
		duration = parseInt($('#time-days').val(), 10),
		books = [],
		daysOfWeek = [],
		order = $('input:radio[name="bibleorder"]:checked').val();
	
	daysOfWeek = $('#section-days input:checked').map(function() { 
		return parseInt($(this).val(), 10) - 1;
	}).get();

	
 	if (order == 'traditional') {
		books = $('.order-traditional .books-list input[type=checkbox]:checked').map(function(index, el) { 
			return $(this).val();
		}).get();	
	} else if (order == 'chronological') {
		books = $('.order-chronological input[type=checkbox]:checked').map(function(index, el) { 
			return $(this).val();
		}).get();
	}
	
	
	// BUG	
	var datastartDate = startDate.addDays(1);
	var data = getPlanData(lang, order, datastartDate, duration, books, daysOfWeek, $('#options-dailypsalm').is(':checked'), $('#options-dailyproverb').is(':checked'));
	var code = window['build' + format](lang, data, startDate, duration, books, daysOfWeek);	
	
	return code;
}


function updateUrl() {
	// params
	var start = $('#time-startdate').val(),
		total = $('#time-days').val(),
		format = $('input[name=formatstyle]:checked').val(),
		order = $('input[name=bibleorder]:checked').val(),	
		lang = $('#options-language').val(),	
		daysofweek = $( '#section-days input:checked' ).map(function() {
			return $( this ).val();
		  })
		  .get()
		  .join( ',' ),
		books = [];

	
	if (order == 'traditional') {

		for (var i=0; i<bible.TESTAMENTS.length; i++) {
			var testament = bible.TESTAMENTS[i];

			if ($('.order-traditional input[value="' + testament + '"]').is(':checked')) {
				books.push(testament);
			} else {
				$('.order-traditional .section-' + testament  + ' .books-list input').each(function() {
					if ($(this).is(':checked'))
						books.push($(this).val());
				});
			}			
		}

	} else {
		for (var i=0; i<bible.TESTAMENTS.length; i++) {
			var testament = bible.TESTAMENTS[i];

			if ($('.order-chronological input[value="' + testament + '"]').is(':checked')) {
				books.push(testament);
			}
		}
		
	}

	// update URL
	history.replaceState({}, 'page', 
				'?start=' + start + 
				'&total=' + total + 
				'&format=' + format + 
				'&order=' + order + 
				'&daysofweek=' + daysofweek + 
				'&books=' + books.join(',') + 
				'&lang=' + lang + 
			
				'&checkbox=' + ($('#options-checkbox').is(':checked') ? '1' : '0') +
				'&colors=' + ($('#options-sectioncolors').is(':checked') ? '1' : '0') +
				'&psalm=' + ($('#options-dailypsalm').is(':checked') ? '1' : '0') +
				'&proverb=' + ($('#options-dailyproverb').is(':checked') ? '1' : '0') +

		  		''		
				);

	
}

function createBookLists() {

	var lang = $('#options-language').val();

	for (var i=0; i<bible.TESTAMENTS.length; i++) {
		var testament = bible.TESTAMENTS[i],
			testament_list = bible[testament + "_BOOKS"];

		// find list
		var list = $('.order-traditional .section-' + testament + ' .books-list')
					.empty();	
					
		console.log(list);

		for (var j=0; j<testament_list.length; j++) {
			var usfm = testament_list[j],
				book = bible.BIBLE_DATA[ usfm ];

			console.log(usfm);

			list.append(
				$('<label><input type="checkbox" value="' + usfm + '">' + bible.getName(book, lang) + '</label>')
			);
		}

	}
}


function startup() {

	var urlParams = new URLSearchParams(window.location.search);

	// lang
	var lang = '';
	if (urlParams.has('lang')) {		
		lang = urlParams.get('lang');
	} else {
		lang = 'en';
		var language = window.navigator.userLanguage || window.navigator.language;

		if (language) {
			var option = $('#options-language option[value="' + language + '"]');
			if (option.length > 0) {
				lang = language;
			} else {
				var shortLanguage = language.split('-')[0];
				option = $('#options-language option[value="' + shortLanguage + '"]');
				if (option.length > 0) {
					lang = shortLanguage;
				}
			}
		}		
	}
	$('#options-language').val(lang);


	createBookLists();


	

	// start
	var startdate = null;
	if (urlParams.has('start')) {		
		startdate = new Date(urlParams.get('start'));
		// time zone screws it up?
		if (startdate) {
			startdate = startdate.addDays(1);
		}
	}
	if (!startdate) {
		var today = new Date(),
		startdate = new Date(today.getFullYear(), today.getMonth()+1, 1);
	}
	$('#time-startdate').val(startdate.toInputField() );		

	// total days
	var total = null;
	if (urlParams.has('total')) {
		total = urlParams.get('total');
	}
	if (!total) {
		total = 365;	
	}	
	$('#time-days').val( total );	
	

	// format
	var format = '';
	if (urlParams.has('format')) {		
		format = urlParams.get('format');
	} else {
		format = 'calendar';
	}
	$('input[name=formatstyle][value=' + format + ']').prop('checked', true);

	// days of week
	var daysofweek = '';
	if (urlParams.has('daysofweek')) {		
		daysofweek = urlParams.get('daysofweek')
	} else {
		daysofweek = '1,2,3,4,5,6,7';
	}
	daysofweek = daysofweek.split(',');
	for (var i=0; i<daysofweek.length; i++) {
		var dayval = daysofweek[i];
		$('#days-' + dayval).prop('checked', true);
	}

	// order
	var order = '';
	if (urlParams.has('order')) {		
		order = urlParams.get('order');
	} else {
		order = 'traditional';
	}
	$('input[name=bibleorder][value=' + order + ']').prop('checked', true);
	

	// books of bible	
	var books = '';		
	if (order == 'traditional') {
		if (urlParams.has('books')) {		
			books = urlParams.get('books');
			books = books.split(',');

			for (var i=0; i<bible.TESTAMENTS.length; i++) {
				var testament = bible.TESTAMENTS[i];

				if (books.indexOf(testament) > -1) {
					$('.order-traditional .section-' + testament + ' input	')						
						.prop('checked',true);
				}
			}
			
			for (var i=0; i<books.length; i++) {
				$('input[value="' + books[i] + '"]').prop('checked',true);
			}

		} else {
			// 
			$('.order-traditional .section-OT input').prop('checked',true);
			$('.order-traditional .section-NT input').prop('checked',true);
		}
		
		$('.order-chronological input[type=checkbox]')
			.prop('checked',true)
			.prop('disabled',true);
	} else {
		if (urlParams.has('books')) {		
			books = urlParams.get('books');
			books = books.split(',');

			for (var i=0; i<bible.TESTAMENTS.length; i++) {
				var testament = bible.TESTAMENTS[i];

				if (books.indexOf(testament) > -1) {
					$('.order-chronological input[value="' + testament + '"]')
						.prop('checked',true);
				}
			}
			
		} else {
			$('.order-chronological input').prop('checked',true);
		}

		$('.order-traditional input[type=checkbox]')
			.prop('checked',true)
			.prop('disabled',true);
	}
	


	// options
	if (urlParams.get('checkbox') == '1' || urlParams.get('checkbox') == '' || !urlParams.has('checkbox')) {	
		$('#options-checkbox').prop('checked',true);
	}	
	if (urlParams.get('colors') == '1') {	
		$('#options-sectioncolors').prop('checked',true);	
	}
	if (urlParams.get('dailypsalm') == '1') {	
		$('#options-dailypsalm').prop('checked',true);	
	}
	if (urlParams.get('dailyproverb') == '1') {	
		$('#options-dailyproverb').prop('checked',true);	
	}
	

	updateDisplay();
}
startup();