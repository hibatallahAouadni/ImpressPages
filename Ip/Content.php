<?php
/**
 * @package ImpressPages
 *
 *
 */

namespace Ip;


use Guzzle\Parser\ParserRegistry;

/**
 *
 * Event dispatcher class
 *
 */
class Content {
    protected $currentLanguage;
    /**
     * @var \Ip\Language[]
     */
    protected $languages;

    protected $layout;

    protected $zones = null;
    protected $zonesData = null;

    protected $languageUrl = null;
    protected $urlVars = null;
    protected $zoneUrl = null;
    protected $currentZoneName = null;

    protected $blockContent = null;
    protected $slotContent = null;

    protected $currentPage = null;
    protected $revision = null;

    /**
     *
     * @return bool true if the system is in management state
     *
     */
    public function isManagementState(){
        $backendLoggedIn = !empty($_SESSION['backend_session']['userId']);
        return $backendLoggedIn && \Ip\Module\Content\Service::isManagementMode();
    }


    public function setLayout($layout)
    {
        $this->layout = $layout;
    }

    public function getLayout()
    {
        if (!$this->layout) {
            $layout = 'main.php';

            $zone = $this->getCurrentZone();
            if ($zone) {
                $page = $this->getCurrentPage();
                if ($page) {
                    $layout = Internal\ContentDb::getPageLayout($zone->getAssociatedModuleGroup(), $zone->getAssociatedModule(), $page->getId());
                }

                if (!$layout && $zone->getLayout()) {
                    $layout = $zone->getLayout();
                }

            }
            if (!is_file(ipConfig()->themeFile($layout))) {
                $layout = 'main.php';
            }

            $this->layout = $layout;
        }

        return $this->layout;
    }

    /**
     * @return \Ip\Language
     */
    public function getCurrentLanguage()
    {
        if (!$this->currentLanguage) {
            $this->parseUrl();
        }
        return $this->currentLanguage;
    }

    /**
     *
     * @param $zoneName
     * @return \Ip\Zone
     *
     */
    public function getZone($zoneName)
    {
        if ($zoneName === '404') {
            return new \Ip\Zone404(array('name' => '404'));
        }

        if (isset($this->zones[$zoneName])) {
            return $this->zones[$zoneName];
        }

        $zonesData= $this->getZonesData();

        if(!isset($zonesData[$zoneName]))
        {
            return false;
        }

        $zoneData = $this->zonesData[$zoneName];
        $this->zones[$zoneName] = $this->createZone($zoneData);
        return $this->zones[$zoneName];

    }

    /**
     *
     * @return \Ip\Zone[]
     *
     */
    public function getZones(){
        $answer = array();
        foreach ($this->getZonesData() as $zoneData) {
            $answer[] = $this->getZone($zoneData['name']);
        }
        return $answer;
    }

    protected function getZonesData()
    {
        if (!$this->zonesData) {
            $this->zonesData = Internal\ContentDb::getZones($this->getCurrentLanguage()->getId());
        }
        return $this->zonesData;
    }

    public function getCurrentZone()
    {
        if ($this->currentZoneName === null) {
            $this->parseUrl();
        }
        return $this->getZone($this->currentZoneName);
    }

    public function getCurrentPage()
    {
        return $this->currentPage;
    }



    /**
     *
     * @return array - all website languages. Each element is an object Language
     *
     */
    public function getLanguages()
    {
        if ($this->languages === null) {
            $languages = Internal\ContentDb::getLanguages(true);
            $this->languages = array();
            foreach($languages as $data){
                $this->languages[] = $this->createLanguage($data);
            }
        }
        return $this->languages;
    }


    //TODOX rename to getLanguage
    /**
     *
     * @return \Ip\Language
     *
     */
    public function getLanguageById($id){
        foreach($this->getLanguages() as $language){
            if ($language->getId() === $id) {
                return $language;
            }
        }
        return false;
    }


    /**
     *
     * @param data array from database
     * @return Language
     *
     *
     */
    private function createLanguage($data)
    {
        $language = new \Ip\Language($data['id'], $data['code'], $data['url'], $data['d_long'], $data['d_short'], $data['visible'], $data['text_direction']);
        return $language;
    }

    private function createZone($zoneData)
    {
        if ($zoneData['associated_module']) {
            $class = '\\Ip\\Module\\' . $zoneData['associated_module'] . '\\Zone';
            if (class_exists($class)) {
                $zoneObject = new $class($zoneData['name']);
            } else {
                $class = '\\Plugin\\' . $zoneData['associated_module'] . '\\Zone';
                $zoneObject = new $class($zoneData['name']);
            }
        } else {
            $zoneObject = new \Ip\DefaultZone($zoneData);
        }

        $zoneObject->setId($zoneData['id']);
        $zoneObject->setName($zoneData['name']);
        $zoneObject->setLayout($zoneData['template']);
        $zoneObject->setTitle($zoneData['title']);
        $zoneObject->setUrl($zoneData['url']);
        $zoneObject->setKeywords($zoneData['keywords']);
        $zoneObject->setDescription($zoneData['description']);
        $zoneObject->setAssociatedModuleGroup($zoneData['associated_group']);
        $zoneObject->setAssociatedModule($zoneData['associated_module']);
        return $zoneObject;
    }



    public function getZoneUrl()
    {
        if ($this->zoneUrl === null) {
            $this->parseUrl();
        }
        return $this->zoneUrl;
    }

    public function getLanguageUrl()
    {
        if ($this->languageUrl === null) {
            $this->parseUrl();
        }
        return $this->languageUrl;
    }

    public function getUrlVars()
    {
        if ($this->urlVars === null) {
            $this->parseUrl();
        }
        return $this->urlVars;
    }

    private function parseUrl()
    {
        $languages = $this->getLanguages();

        //check if admin
        if (ipRequest()->getControllerType() == \Ip\Request::CONTROLLER_TYPE_ADMIN) {
            //admin pages don't have zones
            $this->currentLanguage = $languages[0];
            $this->languageUrl = $this->currentLanguage->getUrl();
            $this->currentZoneName = false;
            return;
        }

        //find language
        $path = \Ip\ServiceLocator::request()->getRelativePath();
        $urlVars = explode('/', rtrim(parse_url($path, PHP_URL_PATH), '/'));
        if ($urlVars[0] == '') {
            array_shift($urlVars);
        }
        $this->urlVars = $urlVars;
        for ($i=0; $i< sizeof($urlVars); $i++){
            $urlVars[$i] = urldecode($urlVars[$i]);
        }
        if (ipGetOption('Config.multilingual') && !empty($urlVars[0])) {
            $languageUrl = urldecode(array_shift($urlVars));
            $this->urlVars = $urlVars;
            foreach ($languages as $language) {
                if ($language->getUrl() == $languageUrl) {
                    $this->currentLanguage = $language;
                    $this->languageUrl = $languageUrl;
                    break;
                }
            }
            //language not found. Set current language as first language from the database and set current zone to '' which means error 404
            if (!$this->currentLanguage) {
                $this->currentLanguage = $languages[0];
                $this->languageUrl = $this->currentLanguage->getId();
                $this->currentZoneName = '';
                return;
            }
        } else {
            $this->currentLanguage = $languages[0];
            $this->languageUrl = $this->currentLanguage->getUrl();
        }

        //find zone
        $zonesData = $this->getZonesData();

        if (count($urlVars)) {
            $potentialZoneUrl = urldecode($urlVars[0]);
            foreach ($zonesData as $zoneData) {
                if ($zoneData['url'] == $potentialZoneUrl) {
                    $this->zoneUrl = $potentialZoneUrl;
                    $this->currentZoneName = $zoneData['name'];
                    array_shift($urlVars);
                    $this->urlVars = $urlVars;
                    break;
                }
            }
            if (!$this->zoneUrl) {
                $zoneWithNoUrl = null;
                foreach ($zonesData as $zoneData) {
                    if ($zoneData['url'] === '') {
                        $zoneWithNoUrl = $zoneData['name'];
                        $this->zoneUrl = '';
                        $this->currentZoneName = $zoneData['name'];
                        break;
                    }
                }
                if (!$zoneWithNoUrl) {
                    $this->currentZoneName = '';
                }

            }
        } else {
            if (empty($zonesData)) {
                throw new \Ip\CoreException('Please insert at least one zone');
            } else {
                $firstZoneData = array_shift($zonesData);
                $this->currentZoneName = $firstZoneData['name'];
            }
        }


        //find current page
        $zone = $this->getZone($this->currentZoneName);
        $currentPage = $zone->getCurrentPage();
        if ($currentPage) {
            $this->currentPage = $currentPage;
        } else {
            $this->currentZoneName = '404';
            $this->currentPage = $this->currentPage = new \Ip\Page404(1, '404');
        }


    }



    public function setBlockContent($block, $content)
    {
        $this->blockContent[$block] = $content;
    }

    public function getBlockContent($block)
    {
        if (isset($this->blockContent[$block])) {
            return $this->blockContent[$block];
        } else {
            return null;
        }
    }

    public function generateBlock($blockName) {
        return new \Ip\Block($blockName);
    }


    public function setSlotContent($name, $content)
    {
        $this->slotContent[$name] = $content;
    }

    public function getSlotContent($name)
    {
        if (isset($this->slotContent[$name])) {
            return $this->slotContent[$name];
        } else {
            return null;
        }
    }

    public function generateSlot($name, $params = array())
    {
        $content = null;
        $data = array (
            'slotName' => $name,
            'params' => $params
        );

        //dispatch event
        $content = ipDispatcher()->job('site.generateSlot', $data);
        if (!$content) {
            $content = ipDispatcher()->job('site.generateSlot.' . $name, $data);
        }

        if ($content) {
            if (is_object($content) && method_exists($content, 'render')) {
                $content = $content->render();
            }
            return $content;
        }

        //look for predefined content
        $predefinedContent = $this->getSlotContent($name);
        if ($predefinedContent !== null) {
            if (is_object($predefinedContent) && method_exists($predefinedContent, 'render')) {
                $predefinedContent = $content->render();
            }
            return $predefinedContent;
        }

        //execute static slot method
        $parts = explode('.', $name, 2);
        if (count($parts) == 2) {
            if (in_array($parts[0], \Ip\Module\Plugins\Model::getModules())) {
                $slotClass = 'Ip\\Module\\'.$parts[0].'\\Slot';
            } else {
                $slotClass = 'Plugin\\'.$parts[0].'\\Slot';
            }
            if (method_exists($slotClass, $parts[1])) {
                $content = $slotClass::$parts[1]($params);
                if (is_object($content) && method_exists($content, 'render')) {
                    $content = $content->render();
                }
                return $content;
            }
        }

        return '';
    }



    /**
     * If we are in the management state and last revision is published, then create new revision.
     *
     */
    public function getRevision() {
        if ($this->revision !== null) {
            return $this->revision;
        }
        $revision = false;
        if (\Ip\ServiceLocator::content()->isManagementState()){
            if (ipRequest()->getQuery('cms_revision')) {
                $revisionId = ipRequest()->getQuery('cms_revision');
                $revision = \Ip\Revision::getRevision($revisionId);
            }

            if ($this->getCurrentPage()) {
                if ($revision === false || $revision['zoneName'] != ipContent()->getCurrentZone()->getName() || $revision['pageId'] != $this->getCurrentPage()->getId() ) {
                    $revision = \Ip\Revision::getLastRevision(ipContent()->getCurrentZone()->getName(), $this->getCurrentPage()->getId());
                    if ($revision['published']) {
                        $revision = $this->duplicateRevision($revision['revisionId']);
                    }
                }
            } else {
                $revision = false;
            }
        } else {
            $currentPage = $this->getCurrentPage();
            if ($currentPage) {
                $revision = \Ip\Revision::getPublishedRevision(ipContent()->getCurrentZone()->getName(), $currentPage->getId());
            }

        }
        $this->revision = $revision;
        return $revision;
    }



    private function duplicateRevision($oldRevisionId){
        $revisionId = \Ip\Revision::duplicateRevision($oldRevisionId);
        $revision = \Ip\Revision::getRevision($revisionId);
        if ($revision === false) {
            throw new \Ip\CoreException("Can't find created revision " . $revisionId, \Ip\CoreException::REVISION);
        }
        return $revision;
    }


    /**
     * @param null $zoneName
     * @param null $pageId
     * @return \Ip\Page[]
     */
    public function getBreadcrumb($zoneName = null, $pageId = null){
        if ($zoneName === null && $pageId !== null || $zoneName !== null && $pageId === null) {
            trigger_error("This method can accept none or both parameters");
        }

        if ($zoneName === null && $pageId === null) {
            $zone = ipContent()->getCurrentZone();
            if (!$zone) {
                return array();
            }
            $breadcrumb = $zone->getBreadcrumb();
        } else {
            $zone = $this->getZone($zoneName);
            if (!$zone) {
                return array();
            }
            $breadcrumb = $zone->getBreadcrumb($pageId);
        }

        if (is_array($breadcrumb)) {
            return $breadcrumb;
        } else {
            return array();
        }

    }


    /**
     * TODOX check zone and language url's against this function
     * Beginning of page URL can conflict with CMS system/core folders. This function checks if the folder can be used in URL beginning.
     *
     * @param $folderName
     * @return bool true if URL is reserved for CMS core
     *
     */
    public function usedUrl($folderName){

        $systemDirs = array();
        $systemDirs[ipConfig()->getRaw('PLUGIN_DIR')] = 1;
        $systemDirs[ipConfig()->getRaw('THEME_DIR')] = 1;
        $systemDirs[ipConfig()->getRaw('FILE_DIR')] = 1;
        $systemDirs['install'] = 1;
        $systemDirs['update'] = 1;
        if(isset($systemDirs[$folderName])){
            return true;
        } else {
            return false;
        }
    }



    /**
     *
     * @return string title of current page
     *
     */
    public function getTitle(){
        $curZone = ipContent()->getCurrentZone();
        if (!$curZone) {
            return '';
        }
        $curEl =  $curZone->getCurrentPage();
        if($curEl && $curEl->getPageTitle() != '') {
            return $curEl->getPageTitle();
        } else {
            return $curZone->getTitle();
        }
    }

    /**
     *
     * @return string description of current page
     *
     */
    public function getDescription(){
        $curZone = ipContent()->getCurrentZone();
        if (!$curZone) {
            return '';
        }
        $curEl =  $curZone->getCurrentPage();
        if($curEl && $curEl->getDescription() != '') {
            return $curEl->getDescription();
        } else {
            return $curZone->getDescription();
        }
    }



    /**
     *
     * @return string keywords of current page
     *
     */
    public function getKeywords(){
        $curZone = ipContent()->getCurrentZone();
        if (!$curZone) {
            return '';
        }

        $curEl = $curZone->getCurrentPage();
        if($curEl && $curEl->getKeywords() != '') {
            return $curEl->getKeywords();
        } else {
            return $curZone->getKeywords();
        }
    }


}