mediaWiki.pagemediagallery = mediaWiki.pagemediagallery || {};

( function ( $, mw, window ) {

	mw.pagemediagallery.browsertab = function(containerId) {
		this.containerId = containerId;
		this.container = $('#' + containerId);
		this.contentBody = this.container.find('.search-content-body');
	}

	mw.pagemediagallery.browsertab.prototype.init = function() {

		this.offset = 0;

		this.container.find('.querymediainput').off('input').on('input', function (e) {
			this.contentBody.html(''); //empty content
			this.browse( e.target.value );
		});

		this.browse( this.getInputValue() );
	}

	mw.pagemediagallery.browsertab.prototype.getInputValue = function() {
		return this.container.find('.querymediainput')[0].value;
	}

	mw.pagemediagallery.browsertab.prototype.browse = function(input) {

		this.container.find('.load-more-content-spinner' ).show(); //show spinner icon

		var browsertab = this;
		function success(jsondata) {
			browsertab.browseRequest(jsondata);
		}

		// first request to get token
		$.ajax({
			type: "GET",
			url: mw.util.wikiScript('api'),
			data: { action:'query', format:'json',  meta: 'tokens', type:'csrf'},
		    dataType: 'json',
		    success: success
		});
	}

	mw.pagemediagallery.browsertab.prototype.browseRequest = function(jsondata) {
		var token = jsondata.query.tokens.csrftoken;
		var data = {};
		data.action = "pagemediagallery_browse";
		data.format = "json";
		console.log(this);
		data.input = this.getInputValue();
		data.token = token;
		if (this.offset) {
			data.offset = this.offset;
		}

		var browsertab = this;
		function success(jsondata) {
			browsertab.browseSuccess(jsondata);
		}

		function error(jsondata) {
 			browsertab.browseError(jsondata);
		}

		$.ajax({ 
			type: "POST",
			url: mw.util.wikiScript('api'),
			data: data,
		    dataType: 'json',
			success: success,
			error: this.browseError
		})
	}

	mw.pagemediagallery.browsertab.prototype.browseSuccess = function(result) {

		this.container.find('.load-more-content-spinner' ).hide();

		if ( result && result.pagemediagallery_browse ) {
			var results = result.pagemediagallery_browse;

			if (!this.offset) { //if offset, we append the results to the content
				this.container.find('.search-content-body').html('');
			}

			if ( results.search ) {
				this.displayResult(results);
				
			} else {
				this.appendNoMoreResults();
			}

			if ( results.continue && results.continue.offset ) {

				this.offset = results.continue.offset;

				this.addScrollEvent();
				
			} else {
				this.disableScrollEvent();
			}

		}else {
			this.appendNoMoreResults();
		}
	}
	
	mw.pagemediagallery.browsertab.prototype.browseError = function(e) {
		console.log( mw.msg('pmg-error-encountered') );
	}


	mw.pagemediagallery.browsertab.prototype.addScrollEvent = function() {

		var $searchcontent = this.container.find('.search-content');
		var $searchcontentbody = this.contentBody;
		var browsertab = this;
		$searchcontent.off('scroll').on('scroll', function() {

		    if( parseInt( $searchcontent.scrollTop() + $searchcontent.height() ) == parseInt( $searchcontentbody.outerHeight( true ) + browsertab.container.find( '.load-more-content' ).outerHeight( true ) ) ) {

		    	browsertab.container.find('.load-more-content-spinner' ).show();

				browsertab.browse(browsertab.input);
		    }
		});
	}

	mw.pagemediagallery.browsertab.prototype.disableScrollEvent = function() {
		$searchcontent = this.container.find('.search-content');
		$searchcontent.off('scroll');
	}

	mw.pagemediagallery.browsertab.prototype.appendNoMoreResults = function() {
		if (this.offset) {
			var div = "<div class='no-more-result'>" + mw.msg('pmg-no-more-match-found') + '</div>';
			this.contentBody.append(div);
		} else {
			this.contentBody.html( mw.msg('pmg-no-match-found') );
		}
	}

	mw.pagemediagallery.browsertab.prototype.displayResult = function(results) {

		var browsertab = this;
		$.each( results.search, function ( index, value ) {
			var $div = $( document.createElement('div') );
			$div.addClass( 'image' );
			$div.attr('data-imagename', value.filename);
			var $img;
			switch (value.mime) {
			  case 'video/mp4':
			  	$img = $( document.createElement('video') );
			    break;
			  case 'application/sla':
			  default:
			  	$img = $( document.createElement('img') );
			}
			$img.attr('src', value.fileurl);
			$img.addClass('file-thumb');
			var $label = $( document.createElement('label') );
			$label.html(value.filename);
			$div.append($img);
			$div.append($label);
			$div.on('click', function() {
				$(this).toggleClass( 'toAddToPage' );
				if ($(this).hasClass('toAddToPage')) {
					$("#addToPage").prop( "disabled", false );
				} else {
					$("#addToPage").prop( "disabled", true );
				}
				MediaManager.window.$modal.find( '.image' ).not($(this)).removeClass('toAddToPage');
			});
			browsertab.contentBody.append($div);
		});
	}

})( jQuery, mediaWiki, window );