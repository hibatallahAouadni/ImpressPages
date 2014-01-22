<?php
/**
 * @package   ImpressPages
 */

namespace Ip\Internal\Design;


class Service
{

    protected function __construct()
    {
    }

    /**
     * @return Service
     */
    public static function instance()
    {
        return new Service();
    }

    public function compileThemeLess($themeName, $filename)
    {
        $lessCompiler = LessCompiler::instance();
        return $lessCompiler->getCompiledCssUrl($themeName, $filename);
    }

    /**
     * @param $themeName
     * @param $filename
     * @return string url to real time compiled less. Available only with admin login.
     */
    public function getRealTimeUrl($themeName, $filename) {
        $configModel = ConfigModel::instance();
        $data = array(
            'aa' => 'Design.realTimeLess',
            'file' => $filename,
            'ipDesignPreview' => 1,
            'ipDesign' => array(
                'pCfg' => $configModel->getAllConfigValues($themeName)
            ),
            'rpc' => '2.0'
        );
        if (isset($_GET['theme'])) {
            //for market preview
            $data['theme'] = $_GET['theme'];
        }

        $url = ipConfig()->baseUrl() . '?' . http_build_query($data);
        return $url;
    }

    /**
     * @param string $name
     * @param string $default
     * @param string $themeName
     * @return string
     */
    public function getThemeOption($name, $default = null, $themeName = null)
    {
        if (!$themeName) {
            $themeName = ipConfig()->theme();
        }
        $configModel = ConfigModel::instance();
        $value = $configModel->getConfigValue($themeName, $name, $default);
        return $value;
    }



    public function saveWidgetOptions(Theme $theme)
    {
        $widgetOptions = $theme->getWidgetOptions();
        if (isset($widgetOptions['image']['width'])) {
            ipSetOption('Content.widgetImageWidth', $widgetOptions['image']['width']);
        }
        if (isset($widgetOptions['image']['height'])) {
            ipSetOption('Content.widgetImageHeight', $widgetOptions['image']['height']);
        }
        if (isset($widgetOptions['image']['bigWidth'])) {
            ipSetOption('Content.widgetImageBigWidth', $widgetOptions['image']['bigWidth']);
        }
        if (isset($widgetOptions['image']['bigHeight'])) {
            ipSetOption('Content.widgetImageBigHeight', $widgetOptions['image']['bigHeight']);
        }

        if (isset($widgetOptions['imageGallery']['width'])) {
            ipSetOption('Content.widgetGalleryWidth', $widgetOptions['imageGallery']['width']);
        }
        if (isset($widgetOptions['imageGallery']['height'])) {
            ipSetOption('Content.widgetGalleryHeight', $widgetOptions['imageGallery']['height']);
        }
        if (isset($widgetOptions['imageGallery']['bigWidth'])) {
            ipSetOption('Content.widgetGalleryBigWidth', $widgetOptions['imageGallery']['bigWidth']);
        }
        if (isset($widgetOptions['imageGallery']['bigHeight'])) {
            ipSetOption('Content.widgetGalleryBigHeight', $widgetOptions['imageGallery']['bigHeight']);
        }

        if (isset($widgetOptions['logoGallery']['width'])) {
            ipSetOption('Content.widgetLogoGalleryWidth', $widgetOptions['logoGallery']['width']);
        }
        if (isset($widgetOptions['logoGallery']['height'])) {
            ipSetOption('Content.widgetLogoGalleryHeight', $widgetOptions['logoGallery']['height']);
        }

        if (isset($widgetOptions['textImage']['width'])) {
            ipSetOption('Content.widgetTextImageWidth', $widgetOptions['textImage']['width']);
        }
        if (isset($widgetOptions['textImage']['height'])) {
            ipSetOption('Content.widgetTextImageHeight', $widgetOptions['textImage']['height']);
        }
        if (isset($widgetOptions['textImage']['bigWidth'])) {
            ipSetOption('Content.widgetTextImageBigWidth', $widgetOptions['textImage']['bigWidth']);
        }
        if (isset($widgetOptions['textImage']['bigHeight'])) {
            ipSetOption('Content.widgetTextImageBigHeight', $widgetOptions['textImage']['bigHeight']);
        }

    }

    public static function getLayouts()
    {
        return Model::instance()->getThemeLayouts();
    }



}
