function twinklearv(){
	var username;

	if ( wgNamespaceNumber == 3 || wgNamespaceNumber == 2 || ( wgNamespaceNumber == -1 && wgTitle == "Contributions" )){

		// If we are on the contributions page, need to parse some then
		if( wgNamespaceNumber == -1 && wgTitle == "Contributions" ) {
			username = decodeURIComponent(document.evaluate( 'substring-after(//div[@id="contentSub"]//a[@title="Special:Log"][last()]/@href, "user=")', document, null, XPathResult.STRING_TYPE, null).stringValue.replace( /\+/g, "%20"));
		} else {
			username = wgTitle.split( '/' )[0]; // only first part before any slashes
		}

		if ( !username ) return;

		var name = isIPAddress( username ) ? 'Report IP' : 'Report';
		var title =  isIPAddress( username ) ? 'Report IP to Administrators' : 'Report user to Administrators';
		
		if (Twinkle.authorizedUser)
		{
			twAddPortletLink( "javascript:twinklearv.callback(\"" + username.replace( /\"/g, "\\\"") + "\")", "ARV", "tw-arv", name, title );
		}
		else
		{
			twAddPortletLink( 'javascript:alert("Your account is too new to use Twinkle.");', 'ARV', 'tw-arv', name, title);
		}
		
		/**
		 TwinkleConfig.markAIVReportAsMinor (boolean)
		 Defines if a reports to AIV should be marked as minor, if false, default is applied as per preference.
		 */
		if( typeof( TwinkleConfig.markAIVReportAsMinor ) == 'undefined' ) {
			TwinkleConfig.markAIVReportAsMinor = true;
		}

		/**
		 TwinkleConfig.markUAAReportAsMinor (boolean)
		 Defines if a reports to UAA should be marked as minor, if false, default is applied as per preference.
		 */
		if( typeof( TwinkleConfig.markUAAReportAsMinor ) == 'undefined' ) {
			TwinkleConfig.markUAAReportAsMinor = true;
		}

		/**
		 TwinkleConfig.markSockReportAsMinor (boolean)
		 Defines if a reports to SPI should be marked as minor, if false, default is applied as per preference.
		 */
		if( typeof( TwinkleConfig.markSockReportAsMinor ) == 'undefined' ) {
			TwinkleConfig.markSockReportAsMinor = true;
		}
	}
}

function num2order( num ) {
	switch( num ) {
	case 1: return '';
	case 2: return '2nd';
	case 3: return '3rd';
	default: return num + 'th';
	}
}

twinklearv.callback = function twinklearvCallback( uid ) {
	if( uid == wgUserName ){
		alert( 'You don\'t want to report yourself, do you?' );
		return;
	}

	var Window = new SimpleWindow( 600, 500 );
	Window.setTitle( "Advance Reporting and Vetting" ); //Backronym

	var form = new QuickForm( twinklearv.callback.evaluate );
	var categories = form.append( {
			type: 'select',
			name: 'category',
			label: 'Select report type: ',
			event: twinklearv.callback.change_category
		} );
	categories.append( {
			type: 'option',
			label: 'Vandalism',
			value: 'aiv'
		} );
	categories.append( {
			type: 'option',
			label: 'Username',
			value: 'username'
		} );
	categories.append( {
			type: 'option',
			label: 'Sockpuppeteer',
			value: 'sock'
		} );
	categories.append( {
			type: 'option',
			label: 'Sockpuppet',
			value: 'puppet'
		} );
	form.append( {
			type: 'field',
			label:'Work area',
			name: 'work_area'
		} );
	form.append( {
			type: 'hidden',
			name: 'uid',
			value: uid
		} );
	
	var result = form.render();
	Window.setContent( result );
	Window.display();

	// We must init the
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.category.dispatchEvent( evt );

}

twinklearv.callback.change_category = function twinklearvCallbackChangeCategory(e) {
	var value = e.target.value;
	var root = e.target.form;
	var old_area;
	for( var i = 0; i < root.childNodes.length; ++i ) {
		var node = root.childNodes[i];
		if( 
			node instanceof Element &&
			node.getAttribute( 'name' ) == 'work_area' 
		) {
			old_area = node;
			break;
		}
	}
	var work_area = null;

	switch( value ) {
	default:
	case 'aiv':
		work_area = new QuickForm.element( { 
				type: 'field',
				label: 'Report user for vandalism',
				name: 'work_area'
			} );
		work_area.append( {
				type: 'input',
				name: 'page',
				label: 'Primary linked page: ',
				tooltip: 'Leave blank to not link to the page in the report',
				value: QueryString.exists( 'vanarticle' ) ? QueryString.get( 'vanarticle' ) : '',
				event: function(e) {
					var value = e.target.value;
					var root = e.target.form;
					if( value == '' ) {
						root.badid.disabled = root.goodid.disabled = true;
					} else {
						root.badid.disabled = false;
						root.goodid.disabled = root.badid.value == '';
					}
				}
			} );
		work_area.append( {
				type: 'input',
				name: 'badid',
				label: 'Revision ID for target page when vandalised: ',
				tooltip: 'Leave blank for no diff link',
				value: QueryString.exists( 'vanarticlerevid' ) ? QueryString.get( 'vanarticlerevid' ) : '',
				disabled: !QueryString.exists( 'vanarticle' ),
				event: function(e) {
					var value = e.target.value;
					var root = e.target.form;
					root.goodid.disabled = value == '';
				}
			} );
		work_area.append( {
				type: 'input',
				name: 'goodid',
				label: 'Last good revision ID before vandalism of target page: ',
				tooltip: 'Leave blank for diff link to previous revision',
				value: QueryString.exists( 'vanarticlegoodrevid' ) ? QueryString.get( 'vanarticlegoodrevid' ) : '',
				disabled: !QueryString.exists( 'vanarticle' ) || QueryString.exists( 'vanarticlerevid' )
			} );
		work_area.append( {
				type: 'checkbox',
				name: 'arvtype',
				list: [
					{ 
						label: 'Vandalism after final (level 4 or 4im) warning given',
						value: 'final'
					},
					{ 
						label: 'Vandalism after recent (within 1 day) release of block',
						value: 'postblock'
					},
					{ 
						label: 'Evidently a vandalism-only account',
						value: 'vandalonly',
						disabled: isIPAddress( root.uid.value )
					},
					{ 
						label: 'Account is evidently a spambot or a compromised account',
						value: 'spambot'
					},
					{ 
						label: 'Account is a promotion-only account',
						value: 'promoonly'
					}
				]
			} );
		work_area.append( {
				type: 'textarea',
				name: 'reason',
				label: 'Comment: '
			} );
		work_area.append( { type:'submit' } );
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;
	case 'username':
		work_area = new QuickForm.element( { 
				type: 'field',
				label: 'Report username violation',
				name: 'work_area'
			} );
		work_area.append ( { 
				type:'header', 
				label:'Type(s) of inappropriate username',
				tooltip: 'Wikipedia does not allow usernames that are misleading, promotional, offensive or disruptive. Domain names and e-mail addresses are likewise prohibited. These criteria apply to both usernames and signatures. Usernames that are inappropriate in another language, or that represent an inappropriate name with misspellings and substitutions, or do so indirectly or by implication, are still considered inappropriate.'
			} );
		work_area.append( {
				type: 'checkbox',
				name: 'arvtype',
				list: [
					{
						label: 'Misleading username',
						value: 'misleading',
						tooltip: 'Misleading usernames imply relevant, misleading things about the contributor. For example, misleading points of fact, an impression of undue authority, or the suggestion that the account is operated by a group, project or collective rather than one individual.'
					},
					{ 
						label: 'Promotional username',
						value: 'promotional',
						tooltip: 'Promotional usernames are advertisements for a company or group.'
					},
					{ 
						label: 'Offensive username',
						value: 'offensive',
						tooltip: 'Offensive usernames make harmonious editing difficult or impossible.'
					},
					{ 
						label: 'Disruptive username',
						value: 'disruptive',
						tooltip: 'Disruptive usernames include outright trolling or personal attacks, or otherwise show a clear intent to disrupt Wikipedia.'
					}
				]
			} );
		work_area.append( {
				type: 'textarea',
				name: 'reason',
				label: 'Comment:'
			} );
		work_area.append( { type:'submit' } );
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;

	case 'puppet':
		work_area = new QuickForm.element( { 
				type: 'field',
				label: 'Report suspected sockpuppet',
				name: 'work_area'
			} );
		work_area.append(
			{
				type: 'input',
				name: 'sockmaster',
				label: 'Sockpuppeteer',
				tooltip: 'The username of the sockpuppeteer (sockmaster) without the User:-prefix',
			}
		);
		work_area.append( {
				type: 'textarea',
				label: 'Evidence:',
				name: 'evidence',
				tooltip: 'Enter your evidence. It should make clear that each of these users is likely to be abusing multiple accounts. Usually this means diffs, page histories or other information that justifies why the users are a) the same and b) disruptive. This should purely be evidence and information needed to judge the matter. Avoid all other discussion that is not evidence of sockpuppetry or other multiple account abuse.'
			} );
		work_area.append( {
				type: 'checkbox',
				list: [ {
					label: 'Request CheckUser evidence',
					name: 'checkuser',
					tooltip: 'CheckUser is a tool used to obtain technical evidence related to a sock-puppetry allegation. It will not be used without good cause, which you must clearly demonstrate. Make sure your evidence explains why CheckUser is appropriate.'
				}, {
					label: 'Notify reported users',
					name: 'notify',
					tooltip: 'Notification is not mandatory. In many cases, especially of chronic sockpuppeteers, notification may be counterproductive. However, especially in less egregious cases involving users who has not been reported before, notification may make the cases fairer and also appear to be fairer in the eyes of the accused. Use your judgment.'
				} ]
			} );
		work_area.append( { type:'submit' } );
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;
	case 'sock':
		work_area = new QuickForm.element( { 
				type: 'field',
				label: 'Report suspected sockpuppeteer',
				name: 'work_area'
			} );
		work_area.append(
			{
				type: 'dyninput',
				name: 'sockpuppet',
				label: 'Sockpuppets',
				sublabel: 'Sock: ',
				tooltip: 'The username of the sockpuppet without the User:-prefix',
				min: 2
			}
		);
		work_area.append( {
				type: 'textarea',
				label: 'Evidence:',
				name: 'evidence',
				tooltip: 'Enter your evidence. It should make clear that each of these users is likely to be abusing multiple accounts. Usually this means diffs, page histories or other information that justifies why the users are a) the same and b) disruptive. This should purely be evidence and information needed to judge the matter. Avoid all other discussion that is not evidence of sockpuppetry or other multiple account abuse.'
			} );
		work_area.append( {
				type: 'checkbox',
				list: [ {
					label: 'Request CheckUser evidence',
					name: 'checkuser',
					tooltip: 'CheckUser is a tool used to obtain technical evidence related to a sock-puppetry allegation. It will not be used without good cause, which you must clearly demonstrate. Make sure your evidence explains why CheckUser is appropriate.'
				}, {
					label: 'Notify reported users',
					name: 'notify',
					tooltip: 'Notification is not mandatory. In many cases, especially of chronic sockpuppeteers, notification may be counterproductive. However, especially in less egregious cases involving users who has not been reported before, notification may make the cases fairer and also appear to be fairer in the eyes of the accused. Use your judgment.'
				} ]
			} );
		work_area.append( { type:'submit' } );
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;
	}
}

twinklearv.callbacks = {
	aiv: function( aivPage ) {
		var text = aivPage.getPageText();
		var params = aivPage.getCallbackParameters();

		uid = params.uid;
		reason = params.reason;

		var re = new RegExp( "\\{\\{\\s*(?:(?:[Ii][Pp])?[Vv]andal|[Uu]serlinks)\\s*\\|\\s*(?:1=)?\\s*" + RegExp.escape( uid, true ) + "\\s*\\}\\}" );

		var myArr;
		if( ( myArr = re.exec( text ) ) ) {
			aivPage.getStatusElement().info( 'Report already present, will not add a new one' );
			return;
		}
		aivPage.getStatusElement().status( 'Adding new report...' );
		
		aivPage.setMinorEdit( TwinkleConfig.markAIVReportAsMinor );
		aivPage.setEditSummary( 'Reporting [[Special:Contributions/' + uid + '|' + uid + ']].'+ TwinkleConfig.summaryAd );
		aivPage.setPageText( text + '*\{\{' + ( isIPAddress( uid ) ? 'IPvandal' : 'vandal' ) + '|' + (/\=/.test( uid ) ? '1=' : '' ) + uid + '\}\} - ' + reason.replace(/\r?\n/g, "<br />") + ' ~~' + '~~' );
		aivPage.save();
	},
	
	username: function( uaaPage ) {
		var text = uaaPage.getPageText();
		var params = uaaPage.getCallbackParameters();
		
		uid = params.uid;
		reason = params.reason;
		
		if (new RegExp( "\\{\\{\\s*user-uaa\\s*\\|\\s*(1\\s*=\\s*)?" + RegExp.escape(uid, true) + "\\s*(\\||\\})" ).test(text)) {
			uaaPage.getStatusElement().error( 'User is already listed.' );
			return;
		}

		uaaPage.setMinorEdit( TwinkleConfig.markUAAReportAsMinor );
		uaaPage.setEditSummary( 'Reporting [[Special:Contributions/' + uid + '|' + uid + ']].'+ TwinkleConfig.summaryAd );
		uaaPage.setPageText( text.replace( /-->/, "-->\n" + reason.replace( '\$', "$$$$" ) ) );
		uaaPage.save();
	},
	
	sock: function( spiPage ) { 
		var text = uaaPage.getPageText();
		var params = uaaPage.getCallbackParameters();
				
		if (params.notify) {
			var masterTalkPage = new Wikipedia.page( 'User talk:' + params.uid, 'Notifying suspected sockpuppeteer' );
			masterTalkPage.setFollowRedirect( true );
			masterTalkPage.setEditSummary( "Notifying about suspicion of sockpuppeteering." + TwinkleConfig.summaryAd );
			masterTalkPage.setAppendText( "\n\{\{subst:socksuspectnotice|1=" + params.uid + "\}\} \~\~\~\~" );
			masterTalkPage.append();

			var statusIndicator = new Status('Notifying suspected sockpuppets', '0%');
			var total = params.sockpuppets.length;
			var current =   0;
			
			var onSuccess = function( sockTalkPage ) {
				var now = parseInt( 100 * ++(current)/total ) + '%';
				statusIndicator.update( now );
				sockTalkPage.getStatusElement().unlink();
				if ( current >= total ) {
					statusIndicator.info( now + ' (completed)' );
					Wikipedia.removeCheckpoint();
				}
			}
			
			Wikipedia.addCheckpoint();
			var socks = params.sockpuppets;
		
			for( var i = 0; i < socks.length; ++i ) {
				var sockTalkPage = new Wikipedia.page( 'User talk:' + socks[i], "Notification for " +  socks[i] );
				sockTalkPage.setFollowRedirect( true );
				sockTalkPage.setEditSummary( "Notifying about suspicion of sockpuppeteering." + TwinkleConfig.summaryAd );
				sockTalkPage.setAppendText( "\n\{\{subst:socksuspectnotice|1=" + socks[i] + "\}\} \~\~\~\~" );
				sockTalkPage.onSuccess( onSuccess );
				sockTalkPage.append();
			}
		}
		text += 
			"\{\{subst:SPI report|socksraw=" +
			params.sockpuppets.map( function(v) { 
					return "* \{\{" + ( isIPAddress( v ) ? "checkip" : "checkuser" ) + "|1=" + v + "\}\}"; 
				} )
				.join( "\n" ) + "\n|evidence=" + params.evidence + " \n";
			
		if ( params.checkuser ) {
				text += "|checkuser=yes";
		}
			
		text += "\}\}";

		spiPage.setMinorEdit( TwinkleConfig.markSockReportAsMinor );
		spiPage.setEditSummary( 'Adding new report for [[Special:Contributions/' + params.uid + '|' + params.uid + ']].'+ TwinkleConfig.summaryAd );
		spiPage.setPageText( text );
		spiPage.save();
	}
}

twinklearv.callback.evaluate = function(e) {
	var form = e.target;
	var reason = "";
	if( form.reason ) {
		comment = form.reason.value;
	}
	var uid = form.uid.value;
	switch( form.category.value ) {
	default:
	case 'aiv':
		var types = form.getChecked( 'arvtype' );
		if( types.length == 0 && comment == '' ) {
			alert( 'You must specify some reason' );
			return;
		}

		types = types.map( function(v) {
				switch(v) {
				case 'final':
					return 'vandalism after final warning';
					break;
				case 'postblock':
					return 'vandalism after recent release of block';
					break;
				case 'spambot':
					return 'account is evidently a spambot or a compromised account';
					break;
				case 'vandalonly':
					return 'actions evidently indicate a vandalism-only account';
					break;
				case 'promoonly':
					return 'account is being used only for promotional purposes';
					break;
				}
			} ).join( ', ' );


		if ( form.page.value != '' ) {
			reason += 'On [[' + form.page.value.replace( /^(Image|Category|File):/i, ':$1:' ) + ']]';

			if ( form.badid.value != '' ) {
				var query = {
					'title': form.page.value,
					'diff': form.badid.value,
					'oldid': form.goodid.value
				};
				reason += ' ([' +  wgServer + wgScriptPath + '/index.php?' + QueryString.create( query ) + ' diff])';
			}
			reason += ';';
		}

		if ( types ) {
			reason += " " + types;
		}
		if (comment != '' ) {
			reason += (reason==""?"":". ") + comment + '.';
		}

		var params = {
			reason: reason, 
			uid: uid
		}

		Status.init( form );
		var aivPage = new Wikipedia.page( 'Wikipedia:Administrator intervention against vandalism', 'Processing AIV request' );
		aivPage.setPageSection(1);
		aivPage.setCallbackParameters( params );
		aivPage.setFollowRedirect( true );
		aivPage.load( twinklearv.callbacks.aiv );

		break;
		
	case 'username':
		var types = form.getChecked( 'arvtype' );
		if( types.length == 0 ) {
			alert( 'You must specify at least one breached violation' );
			return;
		}
		types = types.map( function( v ) { return v.toLowerCaseFirstChar(); } );

		if ( types.length <= 2 ) {
			types = types.join( ' and ' );
		} else {
			types = [ types.slice( 0, -1 ).join( ', ' ), types.slice( -1 ) ].join( ' and ' );
		}
		var article = 'a';
		if ( /[aeiouwyh]/.test( types[0] ) ) { // non 100% correct, but whatever inlcuding 'h' for Cockney
			article = 'an';
		}
		reason = "*\{\{user-uaa|1=" + uid + "\}\} &mdash; Violation of username policy because it's " + article + " " + types + " username; ";
		if (comment != '' ) {
			reason += "''" + comment.toUpperCaseFirstChar() + "''. ";
		}
		reason += "\~\~\~\~";

		var callback = function( uaaPage ) {
			var text = uaaPage.getPageText();
			
			if (new RegExp( "\\{\\{\\s*user-uaa\\s*\\|\\s*(1\\s*=\\s*)?" + RegExp.escape(uid, true) + "\\s*(\\||\\})" ).test(text)) {
				uaaPage.getStatusElement().error( 'User is already listed.' );
				return;
			}

			uaaPage.setMinorEdit( TwinkleConfig.markUAAReportAsMinor );
			uaaPage.setEditSummary( 'Reporting [[Special:Contributions/' + uid + '|' + uid + ']].'+ TwinkleConfig.summaryAd );
			uaaPage.setPageText( text.replace( /-->/, "-->\n" + reason.replace( '\$', "$$$$" ) ) );
			uaaPage.save();
		};

		Status.init( form );
		var uaaPage = new Wikipedia.page( 'Wikipedia:Usernames for administrator attention', 'Processing UAA request' );
		uaaPage.setPageSection(1);
		uaaPage.setFollowRedirect( true );
		uaaPage.load( callback );

		break;
		
	case 'sock':
		var params = {
			uid: uid, 
			sockpuppets: form.getTexts( 'sockpuppet' ), 
			evidence: form.evidence.value.rtrim(), 
			checkuser: form.checkuser.checked, 
			notify: form.notify.checked
		}

		Status.init( form );
		var spiPage = new Wikipedia.page( 'Wikipedia:Sockpuppet investigations/' +  params.uid, 'Retrieving discussion page' );
		spiPage.setCallbackParameters( params );
		spiPage.setFollowRedirect( true );
		spiPage.load( twinklearv.callbacks.sock );

		break;
		
	case 'puppet':
		var params = {
			uid: form.sockmaster.value.rtrim(), 
			sockpuppets: new Array(uid), 
			evidence: form.evidence.value.rtrim(), 
			checkuser: form.checkuser.checked, 
			notify: form.notify.checked
		}

		Status.init( form );
		var spiPage = new Wikipedia.page( 'Wikipedia:Sockpuppet investigations/' +  params.uid, 'Retrieving discussion page' );
		spiPage.setCallbackParameters( params );
		spiPage.setFollowRedirect( true );
		spiPage.load( twinklearv.callbacks.sock );
		
		break;
	}
}

// register initialization callback
Twinkle.init.moduleReady( "twinklearv", twinklearv );