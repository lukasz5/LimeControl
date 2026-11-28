<?php
/**
 * LimeControlBranding — logotypy w nagłówku i stopce ankiety, pasek logotypów partnerów, tekst stopki
 * i kolor marki z automatyczną korektą kontrastu. Zaprojektowana dla motywów ankiet LimeControl
 * (lc_*), działa też z innymi motywami opartymi na fruity_twentythree.
 *
 * Logos in the survey header and footer, a footer logo strip, footer text and a brand colour with
 * automatic contrast correction — for the LimeControl survey themes (and other fruity_twentythree themes).
 *
 * Ustawienia:
 *   - globalne (Konfiguracja → Wtyczki → LimeControlBranding → Konfiguruj) — domyślne dla wszystkich ankiet,
 *   - w ankiecie (Ustawienia ankiety → Proste wtyczki) — „domyślne”, „własne dla tej ankiety” albo „wyłączone”.
 * Obrazy można wgrać bezpośrednio w formularzu ustawień (PNG, JPG, GIF, WebP, do 2 MB).
 *
 * @license GPL-2.0-or-later
 * @link https://limecontrol.eu/szablony.html#branding
 */
class LimeControlBranding extends PluginBase
{
    protected $storage = 'DbStorage';
    protected static $name = 'LimeControlBranding';
    protected static $description = 'Logos in the survey header and footer, a footer logo strip and a brand colour — for the LimeControl survey themes.';

    const VERSION = '1.0.0';
    const MAX_FOOTER_LOGOS = 12;
    const MAX_UPLOAD_BYTES = 2097152;
    const MAX_IMAGE_SIDE = 6000;
    const IMAGE_TYPES = array('png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'gif' => 'image/gif', 'webp' => 'image/webp');

    /** Wszystkie zapisywane ustawienia: klucz => [rodzaj sanitizacji, wartość domyślna]. */
    const FIELDS = array(
        'apply_to' => array('choice:lc,all', 'lc'),
        'mode' => array('choice:inherit,own,off', 'inherit'),
        'header_logo' => array('image', ''),
        'header_logo_alt' => array('text:200', ''),
        'header_logo_link' => array('link', ''),
        'header_logo2' => array('image', ''),
        'header_logo2_alt' => array('text:200', ''),
        'header_logo2_link' => array('link', ''),
        'header_size' => array('choice:m,s,l', 'm'),
        'header_align' => array('choice:start,split,center', 'split'),
        'header_plate' => array('choice:0,1', '0'),
        'footer_title' => array('text:300', ''),
        'footer_logos' => array('logos', '[]'),
        'footer_size' => array('choice:m,s,l', 'm'),
        'footer_text' => array('multiline:2000', ''),
        'footer_link_label' => array('text:120', ''),
        'footer_link_url' => array('link', ''),
        'footer_style' => array('choice:card,white,plain', 'card'),
        'brand_color' => array('color', ''),
        'brand_header' => array('choice:0,1', '0'),
    );

    public function init()
    {
        $this->subscribe('beforeSurveyPage');
        $this->subscribe('beforeSurveySettings');
        $this->subscribe('newSurveySettings');
        $this->subscribe('newDirectRequest');
    }

    // ------------------------------------------------------------------ ustawienia globalne

    public function getPluginSettings($getValues = true)
    {
        $this->settings = $this->definitions('global');
        $this->registerAdminAssets();
        return parent::getPluginSettings($getValues);
    }

    public function saveSettings($settings)
    {
        $clean = array();
        foreach ($settings as $key => $value) {
            if ($key === 'mode' || !isset(self::FIELDS[$key])) {
                continue;
            }
            $clean[$key] = $this->sanitize($key, $value);
        }
        parent::saveSettings($clean);
    }

    // ------------------------------------------------------------------ ustawienia ankiety

    public function beforeSurveySettings()
    {
        $event = $this->getEvent();
        $sid = (int) $event->get('survey');
        $settings = $this->definitions('survey', $sid);
        foreach ($settings as $key => &$setting) {
            if (!isset(self::FIELDS[$key])) {
                continue;
            }
            // Formularz ankiety startuje od wartości domyślnych — „własne” ustawienia to ich kopia do zmiany.
            $global = $this->get($key, null, null, self::FIELDS[$key][1]);
            $setting['current'] = $this->get($key, 'Survey', $sid, $key === 'mode' ? self::FIELDS[$key][1] : $global);
        }
        unset($setting);
        $this->registerAdminAssets();
        $event->set("surveysettings.{$this->id}", array(
            'name' => get_class($this),
            'settings' => $settings,
        ));
    }

    public function newSurveySettings()
    {
        $event = $this->getEvent();
        $sid = (int) $event->get('survey');
        $settings = $event->get('settings');
        if (!$sid || !is_array($settings)) {
            return;
        }
        foreach ($settings as $key => $value) {
            if ($key === 'apply_to' || !isset(self::FIELDS[$key])) {
                continue;
            }
            $this->set($key, $this->sanitize($key, $value), 'Survey', $sid);
        }
    }

    // ------------------------------------------------------------------ strona ankiety

    public function beforeSurveyPage()
    {
        $sid = (int) $this->getEvent()->get('surveyId');
        if (!$sid) {
            return;
        }
        $survey = Survey::model()->findByPk($sid);
        if (!$survey) {
            return;
        }
        $config = $this->surveyConfig($survey);
        if (!$config) {
            return;
        }
        $cs = App()->getClientScript();
        $cs->registerCssFile($this->asset('lc-branding.css'));
        $json = json_encode($config, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $cs->registerScript('LimeControlBrandingConfig', 'window.LCBranding=' . $json . ';', CClientScript::POS_HEAD);
        $cs->registerScriptFile($this->asset('lc-branding.js'), CClientScript::POS_END);
    }

    /**
     * Adres opublikowanego pliku z katalogu assets/ wtyczki. PluginBase::publish() szuka plików tylko w plugins/
     * (wtyczki wgrane przez panel leżą w upload/plugins/), dlatego publikujemy katalog wtyczki bezpośrednio.
     * Wersja w adresie wymusza pobranie nowych plików po aktualizacji wtyczki.
     */
    private function asset($file)
    {
        static $base = null;
        if ($base === null) {
            $base = App()->getAssetManager()->publish(__DIR__ . DIRECTORY_SEPARATOR . 'assets');
        }
        return $base . '/' . $file . '?v=' . self::VERSION;
    }

    /**
     * Konfiguracja dla przeglądarki respondenta albo null, gdy w tej ankiecie nie ma nic do pokazania.
     * @param Survey $survey
     * @return array|null
     */
    public function surveyConfig($survey)
    {
        $sid = (int) $survey->sid;
        $mode = $this->get('mode', 'Survey', $sid, 'inherit');
        if ($mode === 'off') {
            return null;
        }
        $theme = $this->surveyTheme($survey);
        $isLcTheme = strpos($theme, 'lc_') === 0;
        // „Tylko motywy LimeControl” dotyczy ustawień domyślnych; własne ustawienia ankiety działają w każdym motywie.
        if ($mode !== 'own' && $this->get('apply_to', null, null, 'lc') === 'lc' && !$isLcTheme) {
            return null;
        }
        $value = function ($key) use ($mode, $sid) {
            $default = self::FIELDS[$key][1];
            $raw = $mode === 'own' ? $this->get($key, 'Survey', $sid, $default) : $this->get($key, null, null, $default);
            return $this->sanitize($key, $raw);
        };

        $header = array();
        foreach (array('header_logo', 'header_logo2') as $slot) {
            if ($value($slot) !== '') {
                $header[] = array('src' => $value($slot), 'alt' => $value($slot . '_alt'), 'href' => $value($slot . '_link'));
            }
        }
        $footerLogos = json_decode($value('footer_logos'), true) ?: array();
        $link = array('label' => $value('footer_link_label'), 'href' => $value('footer_link_url'));
        $config = array(
            'version' => self::VERSION,
            'lcTheme' => $isLcTheme,
            'fallbackAlt' => $this->surveyTitle($survey),
            'header' => array(
                'logos' => $header,
                'size' => $value('header_size'),
                'align' => $value('header_align'),
                'plate' => $value('header_plate') === '1',
            ),
            'footer' => array(
                'title' => $value('footer_title'),
                'logos' => $footerLogos,
                'size' => $value('footer_size'),
                'text' => $value('footer_text'),
                'link' => $link['href'] !== '' ? $link : null,
                'style' => $value('footer_style'),
            ),
            'color' => array(
                'brand' => $value('brand_color'),
                'header' => $value('brand_header') === '1',
            ),
        );
        $hasFooter = $footerLogos || $config['footer']['title'] !== '' || $config['footer']['text'] !== '' || $config['footer']['link'];
        if (!$header && !$hasFooter && $config['color']['brand'] === '') {
            return null;
        }
        return $config;
    }

    // ------------------------------------------------------------------ wgrywanie obrazów

    public function newDirectRequest()
    {
        $event = $this->getEvent();
        if ($event->get('target') !== get_class($this)) {
            return;
        }
        if ($event->get('function') !== 'upload') {
            $this->json(array('ok' => false, 'error' => 'unknown_function'), 404);
        }
        $request = App()->getRequest();
        // Żądanie POST przechodzi przez walidację tokenu CSRF LimeSurvey (trasa plugins/direct).
        if (!$request->getIsPostRequest()) {
            $this->json(array('ok' => false, 'error' => 'method'), 405);
        }
        if (App()->user->getIsGuest()) {
            $this->json(array('ok' => false, 'error' => $this->t('err_login')), 403);
        }
        $sid = (int) $request->getPost('sid');
        $uploadDir = rtrim((string) App()->getConfig('uploaddir'), '/\\');
        if ($sid > 0) {
            if (!Survey::model()->findByPk($sid)) {
                $this->json(array('ok' => false, 'error' => $this->t('err_survey')), 404);
            }
            if (!Permission::model()->hasSurveyPermission($sid, 'surveysettings', 'update')) {
                $this->json(array('ok' => false, 'error' => $this->t('err_permission')), 403);
            }
            $relative = 'surveys/' . $sid . '/images';
        } else {
            if (!Permission::model()->hasGlobalPermission('settings', 'update')) {
                $this->json(array('ok' => false, 'error' => $this->t('err_permission')), 403);
            }
            $relative = 'themes/survey/generalfiles';
        }

        $file = CUploadedFile::getInstanceByName('image');
        if (!$file || $file->getHasError()) {
            $this->json(array('ok' => false, 'error' => $this->t('err_upload')), 400);
        }
        if ($file->getSize() > self::MAX_UPLOAD_BYTES) {
            $this->json(array('ok' => false, 'error' => $this->t('err_size')), 413);
        }
        $ext = strtolower((string) $file->getExtensionName());
        $info = @getimagesize($file->getTempName());
        if (!isset(self::IMAGE_TYPES[$ext]) || !$info || $info['mime'] !== self::IMAGE_TYPES[$ext]) {
            $this->json(array('ok' => false, 'error' => $this->t('err_type')), 415);
        }
        if ($info[0] < 1 || $info[1] < 1 || $info[0] > self::MAX_IMAGE_SIDE || $info[1] > self::MAX_IMAGE_SIDE) {
            $this->json(array('ok' => false, 'error' => $this->t('err_dimensions')), 415);
        }
        $dir = $uploadDir . '/' . $relative;
        if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
            $this->json(array('ok' => false, 'error' => $this->t('err_write')), 500);
        }
        $name = 'lc-logo-' . bin2hex(random_bytes(6)) . '.' . ($ext === 'jpeg' ? 'jpg' : $ext);
        if (!$file->saveAs($dir . '/' . $name)) {
            $this->json(array('ok' => false, 'error' => $this->t('err_write')), 500);
        }
        $this->json(array(
            'ok' => true,
            'url' => $this->uploadUrl() . '/' . $relative . '/' . $name,
            'width' => $info[0],
            'height' => $info[1],
        ));
    }

    // ------------------------------------------------------------------ pomocnicze

    /** Definicje pól formularza (globalnego lub ankiety) w języku panelu administracyjnego. */
    private function definitions($scope, $sid = 0)
    {
        $choice = function (array $keys) {
            $out = array();
            foreach ($keys as $k => $label) {
                $out[$k] = $this->t($label);
            }
            return $out;
        };
        $endpoint = $this->api->createUrl('plugins/direct', array('plugin' => get_class($this), 'function' => 'upload'));
        $i18n = array();
        foreach (array('js_choose', 'js_replace', 'js_remove', 'js_uploading', 'js_add_logo', 'js_logo', 'js_alt', 'js_link', 'js_up', 'js_down', 'js_limit', 'js_preview_empty', 'js_error', 'js_alt_missing') as $k) {
            $i18n[$k] = $this->t($k);
        }
        $editor = '<div class="lcb-editor" data-endpoint="' . CHtml::encode($endpoint) . '" data-sid="' . (int) $sid . '"'
            . ' data-max="' . self::MAX_FOOTER_LOGOS . '" data-i18n="' . CHtml::encode(json_encode($i18n, JSON_UNESCAPED_UNICODE)) . '">'
            . '<p>' . $this->t($scope === 'survey' ? 'intro_survey' : 'intro_global') . '</p>'
            . '<p class="lcb-hint">' . $this->t('intro_lang') . '</p>'
            . '</div>';

        $d = array('lcb_intro' => array('type' => 'info', 'content' => $editor));
        if ($scope === 'survey') {
            $d['mode'] = array(
                'type' => 'select',
                'label' => $this->t('mode'),
                'help' => $this->t('mode_help'),
                'options' => $choice(array('inherit' => 'mode_inherit', 'own' => 'mode_own', 'off' => 'mode_off')),
                'default' => 'inherit',
            );
        } else {
            $d['apply_to'] = array(
                'type' => 'select',
                'label' => $this->t('apply_to'),
                'help' => $this->t('apply_to_help'),
                'options' => $choice(array('lc' => 'apply_lc', 'all' => 'apply_all')),
                'default' => 'lc',
            );
        }
        $d += array(
            'lcb_header' => array('type' => 'info', 'content' => '<h3 class="lcb-section">' . $this->t('sec_header') . '</h3>'),
            'header_logo' => array('type' => 'string', 'label' => $this->t('header_logo'), 'help' => $this->t('image_help'), 'htmlOptions' => array('class' => 'lcb-image', 'placeholder' => '/upload/…/logo.png')),
            'header_logo_alt' => array('type' => 'string', 'label' => $this->t('alt'), 'help' => $this->t('alt_help')),
            'header_logo_link' => array('type' => 'string', 'label' => $this->t('link'), 'help' => $this->t('link_help'), 'htmlOptions' => array('placeholder' => 'https://')),
            'header_logo2' => array('type' => 'string', 'label' => $this->t('header_logo2'), 'help' => $this->t('header_logo2_help'), 'htmlOptions' => array('class' => 'lcb-image', 'placeholder' => '/upload/…/partner.png')),
            'header_logo2_alt' => array('type' => 'string', 'label' => $this->t('alt'), 'help' => $this->t('alt_help')),
            'header_logo2_link' => array('type' => 'string', 'label' => $this->t('link'), 'htmlOptions' => array('placeholder' => 'https://')),
            'header_size' => array('type' => 'select', 'label' => $this->t('header_size'), 'options' => $choice(array('s' => 'size_s_header', 'm' => 'size_m_header', 'l' => 'size_l_header')), 'default' => 'm'),
            'header_align' => array('type' => 'select', 'label' => $this->t('header_align'), 'options' => $choice(array('split' => 'align_split', 'start' => 'align_start', 'center' => 'align_center')), 'default' => 'split'),
            'header_plate' => array('type' => 'select', 'label' => $this->t('header_plate'), 'help' => $this->t('header_plate_help'), 'options' => $choice(array('0' => 'no', '1' => 'yes')), 'default' => '0'),

            'lcb_footer' => array('type' => 'info', 'content' => '<h3 class="lcb-section">' . $this->t('sec_footer') . '</h3>'),
            'footer_title' => array('type' => 'string', 'label' => $this->t('footer_title'), 'help' => $this->t('footer_title_help')),
            'footer_logos' => array('type' => 'text', 'label' => $this->t('footer_logos'), 'help' => $this->t('footer_logos_help'), 'htmlOptions' => array('class' => 'lcb-logos', 'rows' => 4)),
            'footer_size' => array('type' => 'select', 'label' => $this->t('footer_size'), 'options' => $choice(array('s' => 'size_s_footer', 'm' => 'size_m_footer', 'l' => 'size_l_footer')), 'default' => 'm'),
            'footer_text' => array('type' => 'text', 'label' => $this->t('footer_text'), 'help' => $this->t('footer_text_help'), 'htmlOptions' => array('rows' => 4)),
            'footer_link_label' => array('type' => 'string', 'label' => $this->t('footer_link_label'), 'help' => $this->t('footer_link_label_help')),
            'footer_link_url' => array('type' => 'string', 'label' => $this->t('footer_link_url'), 'htmlOptions' => array('placeholder' => 'https://')),
            'footer_style' => array('type' => 'select', 'label' => $this->t('footer_style'), 'options' => $choice(array('card' => 'style_card', 'white' => 'style_white', 'plain' => 'style_plain')), 'default' => 'card'),

            'lcb_color' => array('type' => 'info', 'content' => '<h3 class="lcb-section">' . $this->t('sec_color') . '</h3>'),
            'brand_color' => array('type' => 'string', 'label' => $this->t('brand_color'), 'help' => $this->t('brand_color_help'), 'htmlOptions' => array('class' => 'lcb-color', 'placeholder' => '#1F6FEB', 'maxlength' => 7)),
            'brand_header' => array('type' => 'select', 'label' => $this->t('brand_header'), 'help' => $this->t('brand_header_help'), 'options' => $choice(array('0' => 'no', '1' => 'yes')), 'default' => '0'),
        );
        foreach ($d as $key => &$def) {
            if (isset(self::FIELDS[$key]) && !isset($def['default'])) {
                $def['default'] = self::FIELDS[$key][1];
            }
        }
        unset($def);
        return $d;
    }

    private function registerAdminAssets()
    {
        if (!(App() instanceof CWebApplication)) {
            return;
        }
        $cs = App()->getClientScript();
        $cs->registerCssFile($this->asset('lc-branding-admin.css'));
        $cs->registerScriptFile($this->asset('lc-branding-admin.js'), CClientScript::POS_END);
    }

    /** Czyści wartość pola według reguły z FIELDS — także przy odczycie (stare albo ręcznie wpisane dane). */
    public function sanitize($key, $value)
    {
        $rule = self::FIELDS[$key][0];
        $default = self::FIELDS[$key][1];
        $value = is_scalar($value) ? trim((string) $value) : '';
        list($type, $arg) = array_pad(explode(':', $rule, 2), 2, '');
        switch ($type) {
            case 'choice':
                return in_array($value, explode(',', $arg), true) ? $value : $default;
            case 'text':
                return $this->cleanText($value, (int) $arg, false);
            case 'multiline':
                return $this->cleanText($value, (int) $arg, true);
            case 'image':
                return $this->cleanUrl($value, false);
            case 'link':
                return $this->cleanUrl($value, true);
            case 'color':
                if (preg_match('/^#?([0-9a-f]{3})$/i', $value, $m)) {
                    $value = '#' . $m[1][0] . $m[1][0] . $m[1][1] . $m[1][1] . $m[1][2] . $m[1][2];
                }
                return preg_match('/^#?([0-9a-f]{6})$/i', $value, $m) ? '#' . strtolower($m[1]) : '';
            case 'logos':
                $items = json_decode($value, true);
                $out = array();
                if (is_array($items)) {
                    foreach ($items as $item) {
                        if (!is_array($item)) {
                            continue;
                        }
                        $src = $this->cleanUrl(isset($item['src']) ? (string) $item['src'] : '', false);
                        if ($src === '') {
                            continue;
                        }
                        $out[] = array(
                            'src' => $src,
                            'alt' => $this->cleanText(isset($item['alt']) ? (string) $item['alt'] : '', 200, false),
                            'href' => $this->cleanUrl(isset($item['href']) ? (string) $item['href'] : '', true),
                        );
                        if (count($out) >= self::MAX_FOOTER_LOGOS) {
                            break;
                        }
                    }
                }
                return json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
        return $default;
    }

    private function cleanText($value, $max, $multiline)
    {
        $value = strip_tags($value);
        $value = $multiline ? preg_replace("/\r\n?/", "\n", $value) : preg_replace('/\s+/u', ' ', $value);
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', (string) $value);
        return trim(mb_substr((string) $value, 0, $max));
    }

    /** Dozwolone: https://…, http://…, ścieżka od korzenia serwisu (/upload/…) oraz — dla linków — mailto: i tel:. */
    private function cleanUrl($value, $isLink)
    {
        if ($value === '' || preg_match('/[\s<>"\'`\\\\]/', $value)) {
            return '';
        }
        if (preg_match('#^https?://#i', $value)) {
            return filter_var($value, FILTER_VALIDATE_URL) ? $value : '';
        }
        if ($value[0] === '/' && (strlen($value) === 1 || $value[1] !== '/')) {
            return $value;
        }
        if ($isLink && preg_match('/^mailto:[^@\s]+@[^@\s]+$/i', $value)) {
            return $value;
        }
        if ($isLink && preg_match('/^tel:\+?[0-9 ()-]{3,20}$/i', $value)) {
            return $value;
        }
        return '';
    }

    /** Adres URL katalogu upload/ jako ścieżka od korzenia serwisu (działa też, gdy LimeSurvey jest w podkatalogu). */
    private function uploadUrl()
    {
        $url = rtrim((string) App()->getConfig('uploadurl'), '/');
        if ($url === '' || (!preg_match('#^(https?:)?//#i', $url) && $url[0] !== '/')) {
            $url = rtrim(App()->getBaseUrl(false), '/') . '/' . ltrim($url !== '' ? $url : 'upload', '/');
        }
        return preg_replace('#^https?://[^/]+#i', '', $url);
    }

    private function surveyTheme($survey)
    {
        $theme = '';
        if (isset($survey->oOptions) && isset($survey->oOptions->template)) {
            $theme = (string) $survey->oOptions->template;
        }
        if ($theme === '' || $theme === 'inherit') {
            $theme = (string) $survey->template;
        }
        return $theme;
    }

    private function surveyTitle($survey)
    {
        $lang = App()->getLanguage();
        if (method_exists($survey, 'getLocalizedTitle')) {
            return (string) $survey->getLocalizedTitle();
        }
        $row = SurveyLanguageSetting::model()->findByPk(array('surveyls_survey_id' => $survey->sid, 'surveyls_language' => $lang));
        return $row ? (string) $row->surveyls_title : '';
    }

    private function json(array $data, $status = 200)
    {
        if (!headers_sent()) {
            http_response_code($status);
            header('Content-Type: application/json; charset=utf-8');
            header('Cache-Control: no-store');
            header('X-Content-Type-Options: nosniff');
        }
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        App()->end();
    }

    /** Teksty panelu administracyjnego (PL, EN, DE) według języka interfejsu. */
    private function t($key)
    {
        static $strings = null;
        if ($strings === null) {
            $strings = require __DIR__ . '/i18n.php';
        }
        $lang = strtolower(substr((string) App()->getLanguage(), 0, 2));
        if (isset($strings[$lang][$key])) {
            return $strings[$lang][$key];
        }
        return isset($strings['en'][$key]) ? $strings['en'][$key] : $key;
    }
}
