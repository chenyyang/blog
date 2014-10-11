---
layout: default
title:  Spring RoseScanner 扫描路经条件
categories:
  - java

---
# {{ page.title }}

##1. RoseScanner

项目启动的时候RoseScanner会先扫描所有的jar包和class目录，会把符合rose条件的拿出来处理。

##2. BeanPostProcessor注册

    import net.paoding.rose.scanning.ResourceRef;
    
    import org.apache.commons.lang.StringUtils;
    import org.apache.commons.logging.Log;
    import org.apache.commons.logging.LogFactory;
    import org.springframework.core.io.Resource;
    
    import java.io.IOException;
    import java.io.InputStream;
    import java.util.Arrays;
    import java.util.Properties;
    import java.util.jar.Attributes;
    import java.util.jar.JarFile;
    import java.util.jar.Manifest;
    
    public class ResourceRef implements Comparable<ResourceRef> {
    
        private static final Log logger = LogFactory.getLog(ResourceRef.class);
    
        private Properties properties = new Properties();
    
        private Resource resource;
    
        private String[] modifiers;
    
        public static ResourceRef toResourceRef(Resource folder) throws IOException {
            ResourceRef rr = new ResourceRef(folder, null, null);
            String[] modifiers = null;
            Resource rosePropertiesResource = rr.getInnerResource("META-INF/rose.properties");
            //if存在这个文件
            if (rosePropertiesResource.exists()) {
                if (logger.isDebugEnabled()) {
                    logger.debug("found rose.properties: " + rosePropertiesResource.getURI());
                }
                InputStream in = rosePropertiesResource.getInputStream();
                rr.properties.load(in);
                in.close();
                String attrValue = rr.properties.getProperty("rose");
                if (attrValue == null) {
                    attrValue = rr.properties.getProperty("Rose");
                }
                if (attrValue != null) {
                    modifiers = StringUtils.split(attrValue, ", ;\n\r\t");
                    if (logger.isDebugEnabled()) {
                        logger.debug("modifiers[by properties][" + rr.getResource().getURI() + "]="
                                + Arrays.toString(modifiers));
                    }
                }
            }
            
            if (modifiers == null) {
                //if不是jar文件，如普通的class路经
                if (!"jar".equals(rr.getProtocol())) {
                    modifiers = new String[] { "**" };
                    if (logger.isDebugEnabled()) {
                        logger.debug("modifiers[by default][" + rr.getResource().getURI() + "]="
                                + Arrays.toString(modifiers));
                    }
                } else {
                    //MANIFEST.MF文件是否有Rose/rose
                    JarFile jarFile = new JarFile(rr.getResource().getFile());
                    Manifest manifest = jarFile.getManifest();
                    if (manifest != null) {
                        Attributes attributes = manifest.getMainAttributes();
                        String attrValue = attributes.getValue("rose");
                        if (attrValue == null) {
                            attrValue = attributes.getValue("Rose");
                        }
                        if (attrValue != null) {
                            modifiers = StringUtils.split(attrValue, ", ;\n\r\t");
                            if (logger.isDebugEnabled()) {
                                logger.debug("modifiers[by manifest.mf][" + rr.getResource().getURI()
                                        + "]=" + Arrays.toString(modifiers));
                            }
                        }
                    }
                }
            }
            rr.setModifiers(modifiers);
            return rr;
        }
    }

如上是核心代码，三大条件：1. META-INF/rose.properties文件  2. 不是jar文件  3. MANIFEST.MF文件有Rose/rose值。

